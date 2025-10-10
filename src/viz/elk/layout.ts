import ELK , { ElkNode, ElkExtendedEdge } from "elkjs";

export type DagNode = {
  id: string;
  title: string;
  ts: number;
  parents: string[];
  refs?: string[];
  pr?: { id: string; url: string } | null;
  ci?: { status: "success" | "failed" | "pending" | "unknown" } | null;
};

export async function elkLayout(nodes: DagNode[], edges: { id: string; source: string; target: string }[]) {
  const elk = new ELK();
  const graph: ElkNode = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.layered.spacing.nodeNodeBetweenLayers": "40",
      "elk.spacing.nodeNode": "24",
      "elk.direction": "RIGHT",
    },
    children: nodes.map((n) => ({ id: n.id, width: 160, height: 36, labels: [{ text: n.title }] })),
    edges: edges.map<ElkExtendedEdge>(e => ({
      id: e.id,
      sources: [e.source],   // ✅ arrays
      targets: [e.target]
    }))
  };
  return elk.layout(graph); // positions
}
