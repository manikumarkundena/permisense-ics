"""
PermiSense Virtual PLC - Modbus Adapter

Bridges the PyModbus simulator datastore with the authoritative PLCState.

PyModbus uses zero-based datastore addresses.

Semantic mapping:
    Holding offset 0  -> 40001
    Holding offset 1  -> 40002
    Holding offset 2  -> 40003
    ...
    Holding offset 9  -> 40010
    Holding offset 12 -> 40013

    Input offset 0 -> 30001
    ...
    Input offset 6 -> 30007
"""

from pymodbus.constants import ExcCodes

from industrial_lab.plc.state import PLCState


HOLDING_BASE = 40001
INPUT_BASE = 30001


def _holding_semantic_address(raw_address: int) -> int:
    """Convert a zero-based holding-register offset to our semantic address."""
    return HOLDING_BASE + raw_address


def _input_semantic_address(raw_address: int) -> int:
    """Convert a zero-based input-register offset to our semantic address."""
    return INPUT_BASE + raw_address


def _encode_holding_registers(state: PLCState) -> list[int]:
    """
    Encode the complete holding-register address space.

    Offsets 0-5  -> 40001-40006
    Offsets 6-8  -> intentionally undefined
    Offsets 9-12 -> 40010-40013
    """
    values = [0] * 13

    for offset in range(6):
        semantic_address = _holding_semantic_address(offset)
        values[offset] = state.get_value(semantic_address)

    for offset in range(9, 13):
        semantic_address = _holding_semantic_address(offset)
        values[offset] = state.get_value(semantic_address)

    return values


def _encode_input_registers(state: PLCState) -> list[int]:
    """Encode the complete input-register address space."""
    return [
        state.get_value(_input_semantic_address(offset))
        for offset in range(7)
    ]


async def modbus_action(
    function_code: int,
    start_address: int,
    address: int,
    count: int,
    current_registers: list[int],
    set_values: list[int] | list[bool] | None,
    *,
    plc_state: PLCState,
):
    """
    Synchronize PyModbus operations with PLCState.

    Parameters are supplied by PyModbus SimRuntime.

    start_address:
        Start address of the configured SimData block.

    address:
        Actual zero-based Modbus datastore address.

    count:
        Number of registers requested.

    current_registers:
        Underlying PyModbus register storage.

    set_values:
        Values being written, or None for a read.
    """

    # ---------------------------------------------------------
    # HOLDING REGISTERS
    # Function codes:
    #   3  = Read Holding Registers
    #   6  = Write Single Register
    #   16 = Write Multiple Registers
    # ---------------------------------------------------------
    if function_code in (3, 6, 16):

        # READ
        if set_values is None:
            values = _encode_holding_registers(plc_state)

            for index in range(count):
                raw_offset = address + index

                if raw_offset < 0 or raw_offset >= len(values):
                    return ExcCodes.ILLEGAL_ADDRESS

                # 40007-40009 are intentionally undefined.
                if raw_offset in (6, 7, 8):
                    return ExcCodes.ILLEGAL_ADDRESS

                current_registers[raw_offset] = values[raw_offset]

            return None

        # WRITE
        for index, raw_value in enumerate(set_values):
            raw_offset = address + index

            # Reserved/undefined offsets.
            if raw_offset in (6, 7, 8):
                return ExcCodes.ILLEGAL_ADDRESS

            if raw_offset < 0 or raw_offset >= 13:
                return ExcCodes.ILLEGAL_ADDRESS

            semantic_address = _holding_semantic_address(raw_offset)

            try:
                plc_state.set_value(
                    semantic_address,
                    int(raw_value),
                )
            except ValueError:
                return ExcCodes.ILLEGAL_VALUE

            # Keep the PyModbus datastore synchronized with PLCState.
            current_registers[raw_offset] = plc_state.get_value(
                semantic_address
            )

        return None

    # ---------------------------------------------------------
    # INPUT REGISTERS
    # Function code 4 = Read Input Registers
    # ---------------------------------------------------------
    if function_code == 4:

        values = _encode_input_registers(plc_state)

        for index in range(count):
            raw_offset = address + index

            if raw_offset < 0 or raw_offset >= len(values):
                return ExcCodes.ILLEGAL_ADDRESS

            current_registers[raw_offset] = values[raw_offset]

        return None

    return None
