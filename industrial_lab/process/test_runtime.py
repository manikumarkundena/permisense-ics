import asyncio

from industrial_lab.plc.controller import VirtualPLC
from industrial_lab.process.runtime import ProcessRuntime


def test_process_updates_shared_plc_state():
    plc = VirtualPLC()
    runtime = ProcessRuntime(
        plc=plc,
        tick_seconds=0.1,
    )

    async def run_test():
        task = asyncio.create_task(runtime.run())

        await asyncio.sleep(0.5)

        runtime.stop()
        await task

    asyncio.run(run_test())

    assert plc.state.actual_speed > 0.0
    assert plc.state.motor_load > 0.0
    assert plc.state.motor_current > 0.0
