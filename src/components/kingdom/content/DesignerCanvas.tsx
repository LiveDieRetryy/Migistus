import React, { useRef } from "react";
import Head from "next/head";

interface DesignerCanvasProps {
  grapesRef: React.RefObject<HTMLDivElement | null>;
}

export default function DesignerCanvas({ grapesRef }: DesignerCanvasProps) {
  return (
    <div className="flex-1 relative">
      <Head>
        <title>Web Designer - Migistus</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <style>{`
          /* Enhanced GrapesJS Block Styling */
          .gjs-block {
            display: flex;
            align-items: center;
            gap: 12px;
            background: linear-gradient(135deg, #27272a 0%, #18181b 100%);
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            padding: 16px 20px;
            margin-bottom: 12px;
            cursor: grab;
            transition: all 0.3s ease;
            border: 2px solid transparent;
            backdrop-filter: blur(10px);
          }
          
          .gjs-block:hover {
            background: linear-gradient(135deg, #facc15 0%, #f59e0b 100%);
            box-shadow: 0 8px 24px rgba(250, 204, 21, 0.4);
            border-color: #facc15;
            transform: translateY(-2px);
          }
          
          .gjs-block.gjs-block-selected {
            background: linear-gradient(135deg, #facc15 0%, #f59e0b 100%);
            box-shadow: 0 8px 24px rgba(250, 204, 21, 0.5);
            border-color: #fbbf24;
          }
          
          .gjs-block-label {
            font-weight: 600;
            color: #facc15;
            font-size: 14px;
            letter-spacing: 0.025em;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: color 0.3s ease;
          }
          
          .gjs-block:hover .gjs-block-label {
            color: #000;
          }
          
          .gjs-block-category {
            font-size: 11px;
            color: #facc15;
            font-weight: 700;
            margin: 16px 0 8px 0;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            padding: 8px 12px;
            background: linear-gradient(90deg, #facc15/20 0%, transparent 100%);
            border-left: 3px solid #facc15;
            border-radius: 0 8px 8px 0;
          }
          
          .gjs-block .fa {
            font-size: 18px;
            color: #facc15;
            margin-right: 0;
            transition: color 0.3s ease;
          }
          
          .gjs-block:hover .fa {
            color: #000;
          }
          
          /* Enhanced Canvas Styling */
          .gjs-cv-canvas {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            min-height: 100vh;
          }
          
          /* Enhanced Component Selection */
          .gjs-comp-selected {
            outline: 3px solid #facc15 !important;
            outline-offset: 2px !important;
            box-shadow: 0 0 0 6px rgba(250, 204, 21, 0.2) !important;
          }
          
          /* Panel Enhancements */
          .gjs-pn-panel {
            background: rgba(39, 39, 42, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(250, 204, 21, 0.3);
            border-radius: 12px;
          }
          
          .gjs-pn-btn {
            background: transparent;
            border: 1px solid rgba(250, 204, 21, 0.3);
            color: #facc15;
            border-radius: 8px;
            margin: 2px;
            transition: all 0.3s ease;
          }
          
          .gjs-pn-btn:hover,
          .gjs-pn-btn.gjs-pn-active {
            background: #facc15;
            color: #000;
            box-shadow: 0 4px 12px rgba(250, 204, 21, 0.4);
          }
        `}</style>
      </Head>
      
      <div 
        ref={grapesRef} 
        className="w-full h-full"
        style={{ 
          background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #cbd5e1 100%)',
          borderRadius: '0',
          position: 'relative'
        }} 
      />
      
      {/* Floating Action Buttons */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-20">
        <button className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-300 text-black rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center">
          <span className="fa fa-plus text-lg" />
        </button>
        <button className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-400 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center">
          <span className="fa fa-layer-group text-lg" />
        </button>
        <button className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-400 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center">
          <span className="fa fa-save text-lg" />
        </button>
      </div>
    </div>
  );
}
