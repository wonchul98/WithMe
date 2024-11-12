'use client';

import React, { useState, useEffect, useRef } from 'react';
import { InfoProvider } from './_contexts/InfoContext';
import { ActiveIdProvider } from './_contexts/ActiveIdContext';
import { MenuItemsProvider } from './_contexts/MenuItemsContext';
import { EditorProvider } from './_contexts/EditorContext';
import { LeftBar } from './_components/LeftBar';
import { LiveblocksProvider } from '@liveblocks/react/suspense';
import Nav from './_components/Nav';
import { MarkdownProvider } from './_contexts/MarkdownContext';
import RightMain from './_components/RightMain';
import LeftMain from './_components/LeftMain';
import { BiDotsVerticalRounded } from 'react-icons/bi';

const LEFT_SIDEBAR_WIDTH = 0;

export default function EditPage() {
  const [leftSize, setLeftSize] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isVertical, setIsVertical] = useState(false);
  const [connected, setConnected] = useState<Set<string>>(new Set());
  const mainContainerRef = useRef<HTMLDivElement | null>(null);

  const handleMouseDown = () => setIsDragging(true);

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && mainContainerRef.current) {
      const containerWidth = mainContainerRef.current.offsetWidth;
      if (isVertical) {
        const adjustedY = e.clientY - 72; // 72px은 Nav 높이로 가정
        const newLeftHeight = (adjustedY / (window.innerHeight - 72)) * 100;
        if (newLeftHeight > 0 && newLeftHeight < 100) {
          setLeftSize(newLeftHeight);
        }
      } else {
        const adjustedX = e.clientX - LEFT_SIDEBAR_WIDTH;
        const newLeftWidth = (adjustedX / containerWidth) * 100;
        if (newLeftWidth > 0 && newLeftWidth < 100) {
          setLeftSize(newLeftWidth);
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    // 컴포넌트가 언마운트될 때 이벤트 리스너 제거
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    const handleResize = () => {
      setIsVertical(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <InfoProvider>
      <ActiveIdProvider>
        <MenuItemsProvider>
          <MarkdownProvider>
            <EditorProvider>
              <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
                <div className="flex flex-col bg-white h-full">
                  <Nav />

                  {connected.size < 10 && (
                    <div
                      className="fixed bottom-0 flex w-full bg-gray-700 opacity-70 justify-center items-center z-[100]"
                      style={{ height: `calc(100vh - 72px)` }}
                    >
                      <div className="w-20 h-20 border-8 border-gray-300 border-t-black rounded-full animate-spin"></div>
                    </div>
                  )}

                  <div className="flex h-full">
                    <div className="h-full fixed z-[50]">
                      <LeftBar />
                    </div>

                    <div
                      className="flex-1"
                      ref={mainContainerRef}
                      style={{ width: `calc(100% - ${LEFT_SIDEBAR_WIDTH}px)` }}
                    >
                      <div className="flex flex-col md:flex-row" style={{ height: `calc(100vh - 72px)` }}>
                        <div
                          style={isVertical ? { height: `${leftSize}%` } : { width: `${leftSize}%` }}
                          className="h-full w-full overflow-y-auto"
                        >
                          <LeftMain connected={connected} setConnected={setConnected} />
                        </div>

                        <div
                          className="bg-gray-400 cursor-pointer flex flex-col items-center justify-around"
                          style={{
                            width: isVertical ? '100%' : '6px',
                            height: isVertical ? '6px' : '100%',
                            cursor: isVertical ? 'row-resize' : 'col-resize',
                          }}
                          onMouseDown={handleMouseDown}
                        >
                          <BiDotsVerticalRounded size={isVertical ? 48 : 24} />
                        </div>

                        <div
                          style={isVertical ? { height: `${100 - leftSize}%` } : { width: `${100 - leftSize}%` }}
                          className="h-full overflow-y-auto"
                        >
                          <RightMain />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </LiveblocksProvider>
            </EditorProvider>
          </MarkdownProvider>
        </MenuItemsProvider>
      </ActiveIdProvider>
    </InfoProvider>
  );
}
