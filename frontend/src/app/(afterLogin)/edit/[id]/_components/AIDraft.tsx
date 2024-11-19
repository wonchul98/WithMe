import React, { useState, useEffect, useRef } from 'react';
import { getCookieValue } from '@/util/axiosConfigClient';
import { useActiveId } from '../_contexts/ActiveIdContext';
import { useMenuItems } from '../_contexts/MenuItemsContext';
import { useAIDraft } from '../_contexts/AIDraftContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import 'github-markdown-css';
import ClipBoardButton from './ClipBoardButton';
import { useParams } from 'next/navigation';
import Image from 'next/image';

export function AIDraft() {
  const { activeId } = useActiveId();
  const { menuItems } = useMenuItems();
  const { messages, addMessage } = useAIDraft();
  const [activeLabel, setActiveLabel] = useState<string>();
  const [isStreaming, setIsStreaming] = useState(false);
  const [accumulatedContent, setAccumulatedContent] = useState<string>('');
  const [reader, setReader] = useState<ReadableStreamDefaultReader | null>(null);
  const [cancelDelay, setCancelDelay] = useState(false);
  const params = useParams();
  const workspaceId = params.id;
  const partialChunkRef = useRef('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const activeMenuItem = menuItems.find((item) => item.id === activeId);
    setActiveLabel(activeMenuItem ? activeMenuItem.label : '');
  }, [menuItems, activeId]);

  useEffect(() => {
    if (accumulatedContent) {
      addMessage({ text: accumulatedContent });
      setAccumulatedContent(''); // 메시지 추가 후 초기화
    }
  }, [isStreaming]);

  const handleSubmit = () => {
    startStreamingResponse();
  };

  const userDataCookie = getCookieValue('userData');
  const userData = JSON.parse(userDataCookie as string);

  const startStreamingResponse = async () => {
    setIsLoading(true);
    setIsStreaming(true);
    setAccumulatedContent('');
    setCancelDelay(false);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/readme/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userData.access_token}`,
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          section_name: activeLabel,
        }),
      });

      if (!response.body) {
        setIsLoading(false);
        throw new Error('ReadableStream not supported in this environment');
      }

      setIsLoading(false);

      const readerInstance = response.body.getReader();
      setReader(readerInstance);
      const decoder = new TextDecoder();

      let isReading = true;

      while (isReading) {
        const { value, done } = await readerInstance.read();
        if (done) {
          isReading = false;
          break;
        }

        // 디코딩한 스트림 데이터를 `data:` 접두사를 제거한 후 파싱 준비
        const chunk = decoder.decode(value, { stream: true }).trim();
        const processText = partialChunkRef.current + chunk;
        partialChunkRef.current = '';
        const lines = processText.split('\n'); // 여러 줄로 분리

        for (const line of lines) {
          // "data:"로 시작하는 줄만 처리
          if (line.startsWith('data:') && line.endsWith('}')) {
            const jsonString = line.slice(5).trim();

            try {
              const jsonData = JSON.parse(jsonString);

              // content가 존재하는 경우에만 처리
              if (jsonData.choices && jsonData.choices[0].delta.content) {
                const content = jsonData.choices[0].delta.content;

                for (const char of content) {
                  if (cancelDelay) {
                    setIsStreaming(false);
                    setAccumulatedContent('');
                    return;
                  }

                  await new Promise((resolve) => setTimeout(resolve, 20)); // 20ms 딜레이
                  setAccumulatedContent((prevContent) => prevContent + char);
                }
              }
            } catch (error) {
              console.error('error line: ', line);
              console.error('Failed to parse JSON chunk:', error);
            }
          } else {
            if (line.endsWith('[DONE]')) {
              partialChunkRef.current = '';
              isReading = false;
              break;
            }
            partialChunkRef.current = line;
          }
        }
      }

      readerInstance.releaseLock();
      setReader(null);
    } catch (error) {
      console.error('Error processing POST response stream:', error);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col items-center responsive_AIDraft min-h-[500px] p-5 rounded-xl bg-gray-100 relative">
      <div
        className="absolute top-3 left-6 text-base font-semibold mb-4"
        style={{ fontFamily: 'Samsungsamsungsharpsans-bold, SamsungOneKorean-700' }}
      >
        현재 목차: {activeLabel}
      </div>
      <button
        onClick={handleSubmit}
        className={`absolute bottom-1 right-8 pb-2 rounded-full ${isStreaming ? 'pointer-events-none' : ''}`}
        disabled={isStreaming && !reader}
      >
        {isStreaming ? (
          <div className="bg-[#f1f0f0]  w-[150px] h-[30px] text-sm flex justify-center items-center rounded-md font-bold text-gray-500">
            <Image alt="twinkle" src="/twinkle.svg" height={15} width={15} className="mr-2" />
            <span>AI 초안 생성하기</span>
          </div>
        ) : (
          <div className="bg-[#f1f0f0] w-[150px] h-[30px] text-sm flex justify-center items-center rounded-md font-bold">
            <Image alt="twinkle" src="/twinkle.svg" height={15} width={15} className="mr-2" />
            <span>AI 초안 생성하기</span>
          </div>
        )}
      </button>
      <div className="mt-3 responsive_AIDraft">
        <div className="rounded-lg py-4">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`mb-4 mx-auto flex p-3 justify-center rounded-lg responsive_AIDraftMsg bg-white relative`}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                rehypePlugins={[rehypeRaw]}
                className="markdown-body flex flex-col justify-start items-start text-left w-full p-4"
              >
                {message.text}
              </ReactMarkdown>
              <ClipBoardButton message={message.text} />
            </div>
          ))}

          {isLoading && (
            <div className="ml-[64px] mt-4">
              <div className="loader"></div>
            </div>
          )}
          {accumulatedContent && (
            <div className="mb-4 mx-auto flex p-3 justify-center rounded-lg  responsive_AIDraftMsg bg-white">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                rehypePlugins={[rehypeRaw]}
                className="markdown-body flex flex-col justify-start items-start text-left w-full p-4"
              >
                {accumulatedContent}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
