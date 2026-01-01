import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Participant } from 'livekit-client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { VideoTile } from './VideoTile';
import { ShareLinkTile } from './ShareLinkTile';

interface VideoGridProps {
    participants: Participant[];
    localParticipant: Participant;
    speakingParticipants: Set<string>;
    raisedHands: Set<string>;
    isScreenSharing: boolean;
    callId?: string;
}

interface GridLayout {
    cols: number;
    rows: number;
    tilesPerPage: number;
    totalPages: number;
    tileWidth: number;
    tileHeight: number;
}

interface ContainerSize {
    width: number;
    height: number;
}

const getMinTileWidth = () => {
    if (typeof window === 'undefined') return 300;
    return window.innerWidth < 768 ? 200 : 300;
};

const getTileGap = () => {
    if (typeof window === 'undefined') return 12;
    return window.innerWidth < 768 ? 8 : 12;
};

const ASPECT_RATIO = 16 / 9;

export const VideoGrid: React.FC<VideoGridProps> = ({
    participants,
    localParticipant,
    speakingParticipants,
    raisedHands,
    isScreenSharing,
    callId,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    
    const [containerSize, setContainerSize] = useState<ContainerSize>({ width: 0, height: 0 });
    const [currentPage, setCurrentPage] = useState(0);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setContainerSize({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                });
            }
        };
        
        updateSize();
        window.addEventListener('resize', updateSize);
        
        const resizeObserver = new ResizeObserver(updateSize);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }
        
        return () => {
            window.removeEventListener('resize', updateSize);
            resizeObserver.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!isScreenSharing || !scrollContainerRef.current) return;
        
        const checkScroll = () => {
            const container = scrollContainerRef.current;
            if (!container) return;
            
            setCanScrollLeft(container.scrollLeft > 0);
            setCanScrollRight(
                container.scrollLeft < container.scrollWidth - container.clientWidth - 1
            );
        };
        
        checkScroll();
        const container = scrollContainerRef.current;
        container.addEventListener('scroll', checkScroll);
        
        return () => {
            container.removeEventListener('scroll', checkScroll);
        };
    }, [isScreenSharing, containerSize]);

    const sortedParticipants = useMemo(() => {
        const all = [localParticipant, ...participants];
        
        return all.sort((a, b) => {
            if (a.isLocal) return -1;
            if (b.isLocal) return 1;
            
            const aRaised = raisedHands.has(a.identity);
            const bRaised = raisedHands.has(b.identity);
            if (aRaised && !bRaised) return -1;
            if (!aRaised && bRaised) return 1;
            
            return 0;
        });
    }, [localParticipant, participants, raisedHands]);

    const totalParticipants = useMemo(() => {
        let count = sortedParticipants.length;
        if (count === 1 && callId) {
            count = 2;
        }
        return count;
    }, [sortedParticipants.length, callId]);

    const calculateGridLayout = (): GridLayout => {
        if (containerSize.width === 0 || containerSize.height === 0) {
            return { cols: 1, rows: 1, tilesPerPage: 1, totalPages: 1, tileWidth: 0, tileHeight: 0 };
        }
        
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        const MIN_TILE_WIDTH = getMinTileWidth();
        const MIN_TILE_HEIGHT = MIN_TILE_WIDTH / ASPECT_RATIO;
        const TILE_GAP = getTileGap();
        
        const availableWidth = containerSize.width - TILE_GAP * 2;
        const availableHeight = containerSize.height - TILE_GAP * 2;
        
        let maxCols = Math.floor((availableWidth + TILE_GAP) / (MIN_TILE_WIDTH + TILE_GAP));
        let maxRows = Math.floor((availableHeight + TILE_GAP) / (MIN_TILE_HEIGHT + TILE_GAP));
        
        if (isMobile) {
            maxCols = 1;
            maxRows = Math.min(maxRows, 4);
        }
        
        const tilesPerPage = maxCols * maxRows;
        const totalPages = Math.ceil(totalParticipants / tilesPerPage);
        
        const participantsOnPage = Math.min(totalParticipants, tilesPerPage);
        
        let bestCols = 1;
        let bestRows = 1;
        let bestTileWidth = 0;
        let bestTileHeight = 0;
        
        for (let cols = 1; cols <= Math.min(maxCols, participantsOnPage); cols++) {
            const rows = Math.ceil(participantsOnPage / cols);
            
            if (rows > maxRows) continue;
            
            let tileWidth = (availableWidth - (cols - 1) * TILE_GAP) / cols;
            let tileHeight = tileWidth / ASPECT_RATIO;
            
            const totalHeight = rows * tileHeight + (rows - 1) * TILE_GAP;
            if (totalHeight > availableHeight) {
                tileHeight = (availableHeight - (rows - 1) * TILE_GAP) / rows;
                tileWidth = tileHeight * ASPECT_RATIO;
            }
            
            const totalWidth = cols * tileWidth + (cols - 1) * TILE_GAP;
            if (totalWidth > availableWidth) {
                continue;
            }
            
            const tileArea = tileWidth * tileHeight;
            const bestArea = bestTileWidth * bestTileHeight;
            if (tileArea > bestArea) {
                bestCols = cols;
                bestRows = rows;
                bestTileWidth = tileWidth;
                bestTileHeight = tileHeight;
            }
        }
        
        return {
            cols: bestCols,
            rows: bestRows,
            tilesPerPage,
            totalPages,
            tileWidth: bestTileWidth,
            tileHeight: bestTileHeight
        };
    };

    const gridLayout = useMemo(() => calculateGridLayout(), [containerSize, totalParticipants]);

    useEffect(() => {
        if (currentPage >= gridLayout.totalPages) {
            setCurrentPage(Math.max(0, gridLayout.totalPages - 1));
        }
    }, [gridLayout.totalPages, currentPage]);

    const handlePrevPage = () => {
        setCurrentPage(prev => Math.max(0, prev - 1));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(gridLayout.totalPages - 1, prev + 1));
    };

    const handleScrollLeft = () => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            container.scrollBy({ left: -container.clientWidth * 0.8, behavior: 'smooth' });
        }
    };

    const handleScrollRight = () => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            container.scrollBy({ left: container.clientWidth * 0.8, behavior: 'smooth' });
        }
    };

    if (isScreenSharing) {
        const TILE_GAP = getTileGap();
        const tileHeight = containerSize.height > 0 ? containerSize.height - TILE_GAP * 2 : 144;
        const tileWidth = tileHeight * ASPECT_RATIO;
        
        return (
            <div ref={containerRef} className="relative h-full w-full bg-background flex items-center">
                <div
                    ref={scrollContainerRef}
                    className="flex gap-3 p-4 overflow-x-auto overflow-y-hidden h-full w-full scrollbar-hide"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {sortedParticipants.map((p) => (
                        <div
                            key={p.identity}
                            className="flex-shrink-0 h-full relative"
                            style={{ width: `${tileWidth}px` }}
                        >
                            <VideoTile
                                participant={p}
                                isLocal={p.isLocal}
                                isCameraEnabled={p.isCameraEnabled}
                                isMicEnabled={p.isMicrophoneEnabled}
                                isSpeaking={speakingParticipants.has(p.identity)}
                                isHandRaised={raisedHands.has(p.identity)}
                            />
                        </div>
                    ))}
                </div>
                {canScrollLeft && (
                    <button
                        onClick={handleScrollLeft}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/80 hover:bg-black/90 text-white p-2 rounded-full transition z-10 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label="Прокрутить влево"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                )}
                {canScrollRight && (
                    <button
                        onClick={handleScrollRight}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/80 hover:bg-black/90 text-white p-2 rounded-full transition z-10 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label="Прокрутить вправо"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                )}
            </div>
        );
    }

    const startIndex = currentPage * gridLayout.tilesPerPage;
    const endIndex = startIndex + gridLayout.tilesPerPage;
    const currentPageParticipants = sortedParticipants.slice(startIndex, endIndex);
    
    const TILE_GAP = getTileGap();
    const rows: typeof currentPageParticipants[] = [];
    for (let i = 0; i < currentPageParticipants.length; i += gridLayout.cols) {
        rows.push(currentPageParticipants.slice(i, i + gridLayout.cols));
    }
    
    const showShareLink = currentPageParticipants.length === 1 && 
                          sortedParticipants.length === 1 && 
                          callId && 
                          currentPage === 0;
    
    if (showShareLink) {
        rows[0].push(null as any);
    }

    return (
        <div ref={containerRef} className="relative h-full w-full bg-background overflow-hidden">
            <div 
                className="flex flex-col items-center justify-center h-full w-full"
                style={{ padding: `${TILE_GAP}px`, gap: `${TILE_GAP}px` }}
            >
                {rows.map((row, rowIndex) => (
                    <div
                        key={rowIndex}
                        className="flex items-center justify-center"
                        style={{
                            width: '100%',
                            gap: `${TILE_GAP}px`
                        }}
                    >
                        {row.map((participant, idx) => {
                            const isShareLink = participant === null;
                            const key = isShareLink ? 'share-link' : participant.identity;
                            
                            return (
                                <div
                                    key={key}
                                    className="flex-shrink-0 relative"
                                    style={{
                                        width: `${gridLayout.tileWidth}px`,
                                        height: `${gridLayout.tileHeight}px`
                                    }}
                                >
                                    {isShareLink ? (
                                        <ShareLinkTile callId={callId!} />
                                    ) : (
                                        <VideoTile
                                            participant={participant}
                                            isLocal={participant.isLocal}
                                            isCameraEnabled={participant.isCameraEnabled}
                                            isMicEnabled={participant.isMicrophoneEnabled}
                                            isSpeaking={speakingParticipants.has(participant.identity)}
                                            isHandRaised={raisedHands.has(participant.identity)}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {gridLayout.totalPages > 1 && (
                <>
                    {currentPage > 0 && (
                        <button
                            onClick={handlePrevPage}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/80 hover:bg-black/90 text-white p-3 rounded-full transition z-10 min-h-[44px] min-w-[44px] flex items-center justify-center"
                            aria-label="Предыдущая страница"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                    )}
                    {currentPage < gridLayout.totalPages - 1 && (
                        <button
                            onClick={handleNextPage}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/80 hover:bg-black/90 text-white p-3 rounded-full transition z-10 min-h-[44px] min-w-[44px] flex items-center justify-center"
                            aria-label="Следующая страница"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    )}
                    <div className="absolute bottom-4 right-4 bg-black/80 px-3 py-1 rounded-lg">
                        <span className="text-white text-sm">
                            Страница {currentPage + 1} / {gridLayout.totalPages}
                        </span>
                    </div>
                </>
            )}
        </div>
    );
};
