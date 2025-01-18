"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  NodeProps,
  Handle,
  Position,
  ReactFlowProvider,
  useReactFlow,
  Connection,
} from "reactflow";
import "reactflow/dist/style.css";

const CustomNode = ({ data }: NodeProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.5 }}
    animate={{
      opacity: 1,
      scale: 1,
      boxShadow: data.isSelected
        ? [
            "0px 0px 0px 0px rgba(0,0,0,0.1)",
            "0px 0px 20px 10px rgba(0,0,0,0.1)",
          ]
        : "0px 0px 0px 0px rgba(0,0,0,0.1)",
    }}
    exit={{ opacity: 0, scale: 0.5 }}
    whileHover={{ scale: 1.05 }}
    transition={{
      boxShadow: {
        repeat: Infinity,
        repeatType: "reverse",
        duration: 1,
      },
    }}
    className="px-6 py-4 shadow-md rounded-md border-2 border-stone-400 "
  >
    <div className="flex items-center">
      {data.icon && <data.icon className="w-12 h-12 mr-4" />}
      <div>
        <div className="text-xl font-bold px-5">{data.label}</div>
        <div className="text-gray-500 px-5">{data.description}</div>
      </div>
    </div>
    <Handle
      type="target"
      position={Position.Top}
      className="w-16 !bg-teal-500"
    />
    <Handle
      type="source"
      position={Position.Bottom}
      className="w-16 !bg-teal-500"
    />
  </motion.div>
);

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

const initialNodes: Node[] = [
  {
    id: "1",
    type: "custom",
    position: { x: 400, y: 0 },
    data: {
      label: "User",
      description: "Interacts with website",
      icon: () => (
        <svg
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
  },
  {
    id: "2",
    type: "custom",
    position: { x: 400, y: 150 },
    data: {
      label: "NextJS Frontend",
      description: "User interface",
      icon: () => (
        <svg
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
          />
        </svg>
      ),
    },
  },
  {
    id: "3",
    type: "custom",
    position: { x: 400, y: 450 },
    data: {
      label: "FastAPI Backend",
      description: "Server processing",
      icon: () => (
        <svg
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
          />
        </svg>
      ),
    },
  },
  {
    id: "4",
    type: "custom",
    position: { x: 850, y: 450 },
    data: {
      label: "Supabase",
      description: "Database",
      icon: () => (
        <svg
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
          />
        </svg>
      ),
    },
  },
  {
    id: "5",
    type: "custom",
    position: { x: -30, y: 450 },
    data: {
      label: "Generative AI",
      description: "AI processing",
      icon: () => (
        <svg
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
  },
  {
    id: "6",
    type: "custom",
    position: { x: -100, y: 600 },
    data: {
      label: "Personalized Recommendations",
      description: "Based on current interests",
      icon: () => (
        <svg
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
          />
        </svg>
      ),
    },
  },
  {
    id: "7",
    type: "custom",
    position: { x: 800, y: 300 },
    data: {
      label: "Preference Learning",
      description: "Evolving user taste profile",
      icon: () => (
        <svg
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
    },
  },
  {
    id: "8",
    type: "custom",
    position: { x: -50, y: 300 },
    data: {
      label: "Character Chatbot",
      description: "Personalized AI companion",
      icon: () => (
        <svg
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      ),
    },
  },
  {
    id: "9",
    type: "custom",
    position: { x: 770, y: 600 },
    data: {
      label: "Watching Patterns Analysis",
      description: "Deep insights for recommendations",
      icon: () => (
        <svg
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
  },
];

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", animated: true },
  { id: "e2-3", source: "2", target: "3", animated: true },
  { id: "e3-4", source: "3", target: "4", animated: true },
  { id: "e3-5", source: "3", target: "5", animated: true },
  { id: "e5-3", source: "5", target: "3", animated: true },
  { id: "e3-6", source: "3", target: "6", animated: true },
  { id: "e6-2", source: "6", target: "2", animated: true },
  { id: "e3-7", source: "3", target: "7", animated: true },
  { id: "e7-4", source: "7", target: "4", animated: true },
  { id: "e3-8", source: "3", target: "8", animated: true },
  { id: "e8-2", source: "8", target: "2", animated: true },
  { id: "e3-9", source: "3", target: "9", animated: true },
  { id: "e9-6", source: "9", target: "6", animated: true },
];

function AnimeRecommendationFlow() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const { fitView } = useReactFlow();

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  useEffect(() => {
    fitView({ padding: 0.2, includeHiddenNodes: false });
  }, [fitView]);

  return (
    <ReactFlowProvider>
      <div style={{ width: "100%", height: "600px" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          defaultEdgeOptions={{
            type: "simplebezier",
            style: { strokeWidth: 2 },
          }}
          zoomOnScroll={false}
          zoomOnPinch={false}
          panOnScroll={false}
          panOnScrollSpeed={0.5}
        >
          {/* <Controls /> */}
          {/* <MiniMap /> */}
          <Background gap={12} size={1} />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  );
}
export default function FlowWithProvider() {
  return (
    <ReactFlowProvider>
      <AnimeRecommendationFlow />
    </ReactFlowProvider>
  );
}
