from typing import Literal

from pydantic import BaseModel, Field


class EvidenceNode(BaseModel):
    id: str
    type: Literal[
        "event",
        "detection",
        "mitre",
        "impact",
        "risk",
    ]
    label: str
    data: dict = Field(default_factory=dict)


class EvidenceEdge(BaseModel):
    source: str
    target: str
    relation: str


class EvidenceGraph(BaseModel):
    nodes: list[EvidenceNode] = Field(default_factory=list)
    edges: list[EvidenceEdge] = Field(default_factory=list)
