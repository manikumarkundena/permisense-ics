"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls, RoundedBox, Text } from "@react-three/drei";
import { AlertTriangle, ArrowRight, CheckCircle2, ShieldAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type Phase = "normal" | "write" | "deviation" | "incident" | "recovery";

function Machine({ phase }: { phase: Phase }) {
  const rotor = useRef<THREE.Mesh>(null);
  const [speed, setSpeed] = useState(50);
  useEffect(() => {
    const target = phase === "write" || phase === "deviation" || phase === "incident" ? 90 : 50;
    let value = phase === "recovery" ? 90 : target;
    const id = window.setInterval(() => {
      value += (target - value) * 0.18;
      setSpeed(value);
    }, 40);
    return () => window.clearInterval(id);
  }, [phase]);

  useFrame((_, delta) => {
    if (rotor.current) rotor.current.rotation.x += delta * (speed / 18);
  });

  const threat = phase === "write" || phase === "deviation" || phase === "incident";
  return <group>
    <RoundedBox args={[1.25, 1.05, .78]} radius={.07} position={[-2.45,.75,0]}>
      <meshStandardMaterial color="#d8dee5" roughness={.58} metalness={.3}/>
    </RoundedBox>
    <mesh position={[-2.45,.75,.42]}><boxGeometry args={[.72,.23,.02]}/><meshStandardMaterial color="#18212b"/></mesh>
    <Text position={[-2.45,.75,.45]} fontSize={.09} color="white">PLC-01</Text>

    <mesh position={[-1.15,.12,0]} rotation={[0,0,Math.PI/2]}>
      <cylinderGeometry args={[.43,.43,.82,32]}/>
      <meshStandardMaterial color={threat ? "#9d6260" : "#596572"} metalness={.72} roughness={.3}/>
    </mesh>
    <mesh ref={rotor} position={[-.73,.12,0]} rotation={[0,0,Math.PI/2]}>
      <cylinderGeometry args={[.16,.16,.12,24]}/>
      <meshStandardMaterial color={threat ? "#df7770" : "#aab4be"} metalness={.72} roughness={.22}/>
    </mesh>

    <mesh position={[1.05,-.34,0]}><boxGeometry args={[3.8,.18,1.12]}/><meshStandardMaterial color="#313a43" roughness={.72} metalness={.2}/></mesh>
    {Array.from({length:12}).map((_,i)=><mesh key={i} position={[-.52+i*.31,-.2,0]} rotation={[0,0,phase==="incident"?i*.08:0]}>
      <boxGeometry args={[.11,.055,1.02]}/><meshStandardMaterial color={threat?"#a66a68":"#89949e"} />
    </mesh>)}

    {[
      [0.25,.52,.43,"SPEED"],
      [1.25,.52,.43,"LOAD"],
      [2.2,.52,.43,"POSITION"]
    ].map(([x,y,z,label])=><group key={String(label)} position={[Number(x),Number(y),Number(z)]}>
      <mesh><sphereGeometry args={[.105,18,18]}/><meshStandardMaterial color={threat&&label==="SPEED"?"#dc655e":"#4d83d9"} emissive={threat&&label==="SPEED"?"#dc655e":"#4d83d9"} emissiveIntensity={.8}/></mesh>
      <Text position={[0,.21,0]} fontSize={.062} color="#64717d">{String(label)}</Text>
    </group>)}

    <mesh position={[-.1,.34,0]}><boxGeometry args={[.98,.025,.025]}/><meshBasicMaterial color={threat?"#d86b64":"#6d7b88"}/></mesh>
    <Text position={[.55,.98,0]} fontSize={.075} color={threat?"#c94f49":"#5e6873"}>MOTOR / DRIVE</Text>
    <Text position={[1.1,.9,0]} fontSize={.095} color={threat?"#c94f49":"#4d83d9"}>{`SPEED ${speed.toFixed(0)}`}</Text>
  </group>;
}

function Scene({ phase }: { phase: Phase }) {
  return <>
    <ambientLight intensity={1.5}/>
    <directionalLight position={[4,7,6]} intensity={2.2}/>
    <directionalLight position={[-4,2,-4]} intensity={.8}/>
    <Environment preset="city"/>
    <group rotation={[-.02,-.15,0]}>
      <mesh position={[0,-.84,0]} rotation={[-Math.PI/2,0,0]}>
        <planeGeometry args={[7.6,4.8]}/><meshStandardMaterial color="#eef1f4" roughness={.9}/>
      </mesh>
      <Machine phase={phase}/>
      <Text position={[-2.45,1.5,0]} fontSize={.105} color="#4b5661">ENGINEERING / HMI</Text>
      <Text position={[1.1,1.5,0]} fontSize={.105} color="#4b5661">PROCESS CELL</Text>
    </group>
    <OrbitControls enablePan={false} minDistance={5.5} maxDistance={8} minPolarAngle={Math.PI/3} maxPolarAngle={Math.PI/2.05}/>
  </>;
}

const phases: { key: Phase; title: string; detail: string }[] = [
  {key:"normal",title:"PROCESS NOMINAL",detail:"PLC-01 · 40003 = 50.0"},
  {key:"write",title:"CONTROL WRITE DETECTED",detail:"40003 · 50.0 → 90.0"},
  {key:"deviation",title:"PROCESS DEVIATION",detail:"Actual speed 90.0 > threshold 80.0"},
  {key:"incident",title:"INCIDENT CORRELATED",detail:"Control + process evidence linked"},
  {key:"recovery",title:"RECOVERY VERIFIED",detail:"Safe speed restored to 50.0"}
];

export function IndustrialCell() {
  const [index,setIndex]=useState(0);
  const phase=phases[index];
  useEffect(()=>{const id=window.setInterval(()=>setIndex(i=>(i+1)%phases.length),4300);return()=>window.clearInterval(id)},[]);
  const threat=["write","deviation","incident"].includes(phase.key);
  return <div className={`cell-canvas twin-${phase.key}`} aria-label="Interactive digital twin demonstration of the PermiSense industrial cell">
    <Canvas camera={{position:[5.9,3.8,6.1],fov:37}} dpr={[1,1.6]} gl={{antialias:true,alpha:true}}>
      <Scene phase={phase.key}/>
    </Canvas>
    <div className="twin-header"><span className={threat?"twin-alert-dot":"cell-live-dot"}/><strong>CYBER-PHYSICAL DIGITAL TWIN</strong><span>DEMO SEQUENCE</span></div>
    <div className={`twin-event ${threat?"is-threat":""}`}>
      <div className="twin-event-icon">{phase.key==="recovery"?<CheckCircle2 size={18}/>:threat?<ShieldAlert size={18}/>:<CheckCircle2 size={18}/>}</div>
      <div><small>{phase.title}</small><strong>{phase.detail}</strong></div>
    </div>
    <div className="twin-chain"><span className={!threat?"active":""}>PLC</span><ArrowRight/><span className={phase.key==="deviation"||phase.key==="incident"||phase.key==="recovery"?"active":""}>PROCESS</span><ArrowRight/><span className={phase.key==="incident"||phase.key==="recovery"?"active":""}>IMPACT</span><ArrowRight/><span className={phase.key==="recovery"?"active":""}>RECOVER</span></div>
    {threat && <div className="twin-warning"><AlertTriangle size={13}/> SECURITY CONTEXT ACTIVE</div>}
  </div>;
}
