import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
    LiveKitRoom,
    useTracks,
    useRoomContext,
    useLocalParticipant,
    useParticipants,
    RoomAudioRenderer,
} from '@livekit/components-react';
import { Track, RoomEvent, Participant } from 'livekit-client';
import '@livekit/components-styles';

import { PreCallSetup } from '../components/PreCallSetup';
import { VideoGrid } from '../components/VideoGrid';
import { ControlPanel } from '../components/ControlPanel';
import { ChatPanel } from '../components/ChatPanel';
import { RaisedHandsBadge } from '../components/RaisedHandsBadge';
import { YouTubePlayer } from '../components/YouTubePlayer';
import { getToken } from '@/services/api';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Monitor } from 'lucide-react';

// Message types for data channel
interface ChatMessage {
    id: string;
    sender: string;
    text: string;
    timestamp: number;
}

interface DataMessage {
    type: 'chat' | 'raised_hand';
    payload: any;
}

// Featured Content Item Type
type FeaturedItem =
    | { type: 'screen', track: any, identity: string }
    | { type: 'youtube' };

// Carousel Item Component
const CarouselItem = ({ item, isActive, isUiVisible, total, index, onYouTubeClose }: { item: FeaturedItem, isActive: boolean, isUiVisible: boolean, total: number, index: number, onYouTubeClose: () => void }) => {
    const videoRef = React.useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && item.type === 'screen' && item.track) {
            item.track.attach(videoRef.current);
            return () => {
                if (videoRef.current) item.track.detach(videoRef.current);
            };
        }
    }, [item]);

    if (item.type === 'youtube') {
        return (
            <div className={`w-full h-full absolute inset-0 transition-opacity duration-500 ${isActive ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
                <YouTubePlayer
                    onClose={onYouTubeClose}
                    isVisible={isActive}
                    isUiVisible={isUiVisible}
                />
            </div>
        );
    }

    return (
        <div className={`w-full h-full absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${isActive ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
            />

            {/* Screen info badge */}
            <div className={`absolute top-4 left-4 bg-background/90 px-3 py-1.5 rounded-lg flex items-center gap-2 z-[21] transition-all duration-500 ${isUiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                <Monitor className="w-4 h-4" />
                <span className="text-sm font-medium">
                    {item.identity || 'Screen Share'}
                </span>
                {total > 1 && (
                    <span className="text-xs text-muted-foreground ml-2">
                        {index + 1} / {total}
                    </span>
                )}
            </div>
        </div>
    );
};

// Content Carousel Component
const ContentCarousel = ({ items, onYouTubeClose, isUiVisible }: { items: FeaturedItem[], onYouTubeClose: () => void, isUiVisible: boolean }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Sync currentIndex with items length
    useEffect(() => {
        if (currentIndex >= items.length && items.length > 0) {
            setCurrentIndex(items.length - 1);
        }
    }, [items.length, currentIndex]);

    // Auto-switch to YouTube if it's newly added
    const prevItemsLength = React.useRef(items.length);
    useEffect(() => {
        if (items.length > prevItemsLength.current) {
            const youtubeIndex = items.findIndex(item => item.type === 'youtube');
            if (youtubeIndex !== -1) {
                setCurrentIndex(youtubeIndex);
            }
        }
        prevItemsLength.current = items.length;
    }, [items]);

    if (items.length === 0) return null;

    // Boundary check for render
    const safeIndex = Math.min(currentIndex, items.length - 1);
    const effectiveIndex = safeIndex < 0 ? 0 : safeIndex;

    return (
        <div className="w-full h-full bg-muted flex-shrink-0 relative flex items-center justify-center overflow-hidden">
            {items.map((item, idx) => (
                <CarouselItem
                    key={item.type === 'screen' ? `screen-${item.identity}` : 'youtube'}
                    item={item}
                    isActive={idx === effectiveIndex}
                    isUiVisible={isUiVisible}
                    total={items.length}
                    index={idx}
                    onYouTubeClose={onYouTubeClose}
                />
            ))}

            {/* Navigation arrows (only if more than 1 item) */}
            {items.length > 1 && (
                <div className={`transition-all duration-500 z-30 ${isUiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <button
                        onClick={() => setCurrentIndex(prev => prev > 0 ? prev - 1 : items.length - 1)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 hover:bg-background rounded-full flex items-center justify-center transition-colors shadow-lg group"
                    >
                        <ChevronLeft className="w-6 h-6 text-muted-foreground group-hover:text-foreground" />
                    </button>
                    <button
                        onClick={() => setCurrentIndex(prev => prev < items.length - 1 ? prev + 1 : 0)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 hover:bg-background rounded-full flex items-center justify-center transition-colors shadow-lg group"
                    >
                        <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-foreground" />
                    </button>
                </div>
            )}

            {/* Dots indicator */}
            {items.length > 1 && (
                <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30 pointer-events-none transition-all duration-500 ${isUiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    {items.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-colors pointer-events-auto ${idx === effectiveIndex ? 'bg-primary' : 'bg-muted-foreground/50'
                                }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// Inner component to handle Room context logic
const CallContent = ({ onLeave, callId }: { onLeave: () => void; callId: string }) => {
    const room = useRoomContext();
    const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
    const participants = useParticipants();
    const { localParticipant } = useLocalParticipant();

    // States
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isYouTubeActive, setIsYouTubeActive] = useState(false);
    const [speakingParticipants, setSpeakingParticipants] = useState<Set<string>>(new Set());
    const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set());
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isParticipantsVisible, setIsParticipantsVisible] = useState(true);
    const [isUiVisible, setIsUiVisible] = useState(true);
    const idleTimerRef = React.useRef<NodeJS.Timeout | null>(null);

    const restartIdleTimer = useCallback(() => {
        setIsUiVisible(true);
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => {
            setIsUiVisible(false);
        }, 5000);
    }, []);

    useEffect(() => {
        const events = ['mousemove', 'mousedown', 'keydown', 'touchstart'];
        const handleInteraction = () => restartIdleTimer();

        restartIdleTimer();
        events.forEach(e => window.addEventListener(e, handleInteraction, { passive: true }));

        return () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            events.forEach(e => window.removeEventListener(e, handleInteraction));
        };
    }, [restartIdleTimer]);

    // Collect all screen share tracks
    const screenTracks = tracks
        .filter(t => t.source === Track.Source.ScreenShare && t.publication?.track)
        .map(t => ({
            track: t.publication!.track!,
            participantIdentity: t.participant?.name || t.participant?.identity || 'Unknown'
        }));



    // Data channel for chat and raised hands
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const sendDataMessage = useCallback((message: DataMessage) => {
        const data = encoder.encode(JSON.stringify(message));
        localParticipant.publishData(data, { reliable: true });
    }, [localParticipant]);

    // Handle incoming data messages
    useEffect(() => {
        const handleDataReceived = (payload: Uint8Array, participant?: Participant) => {
            try {
                const message: DataMessage = JSON.parse(decoder.decode(payload));

                if (message.type === 'chat') {
                    const chatMsg: ChatMessage = {
                        id: Date.now().toString() + Math.random(),
                        sender: participant?.name || participant?.identity || 'Unknown',
                        text: message.payload.text,
                        timestamp: Date.now(),
                    };
                    setMessages(prev => [...prev, chatMsg]);
                } else if (message.type === 'raised_hand') {
                    const { identity, raised } = message.payload;
                    setRaisedHands(prev => {
                        const next = new Set(prev);
                        if (raised) {
                            next.add(identity);
                        } else {
                            next.delete(identity);
                        }
                        return next;
                    });
                } else if ((message as any).type === 'youtube_sync') {
                    const { action } = (message as any).payload;
                    if (action === 'load' || action === 'sync_response') {
                        setIsYouTubeActive(true);
                    } else if (action === 'close') {
                        setIsYouTubeActive(false);
                    }
                }
            } catch (e) {
                console.error('Failed to parse data message', e);
            }
        };

        room.on(RoomEvent.DataReceived, handleDataReceived);
        return () => { room.off(RoomEvent.DataReceived, handleDataReceived); };
    }, [room]);

    // Speaking detection
    useEffect(() => {
        const onActiveSpeakersChanged = (speakers: Participant[]) => {
            const output = new Set<string>();
            speakers.forEach(s => output.add(s.identity));
            setSpeakingParticipants(output);
        }
        room.on(RoomEvent.ActiveSpeakersChanged, onActiveSpeakersChanged);
        return () => { room.off(RoomEvent.ActiveSpeakersChanged, onActiveSpeakersChanged); }
    }, [room]);

    // Handlers
    const toggleCamera = () => localParticipant.setCameraEnabled(!localParticipant.isCameraEnabled);
    const toggleMicrophone = () => localParticipant.setMicrophoneEnabled(!localParticipant.isMicrophoneEnabled);
    const toggleScreenShare = () => localParticipant.setScreenShareEnabled(!localParticipant.isScreenShareEnabled);

    const toggleRaiseHand = () => {
        const isCurrentlyRaised = raisedHands.has(localParticipant.identity);
        const newRaised = !isCurrentlyRaised;

        // Update local state
        setRaisedHands(prev => {
            const next = new Set(prev);
            if (newRaised) {
                next.add(localParticipant.identity);
            } else {
                next.delete(localParticipant.identity);
            }
            return next;
        });

        // Broadcast to others
        sendDataMessage({
            type: 'raised_hand',
            payload: { identity: localParticipant.identity, raised: newRaised }
        });
    };

    const sendMessage = (text: string) => {
        // Add to local messages
        const msg: ChatMessage = {
            id: Date.now().toString(),
            sender: localParticipant.name || 'Me',
            text,
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, msg]);

        // Broadcast to others
        sendDataMessage({
            type: 'chat',
            payload: { text }
        });
    };

    // Build featured items list (Screens + YouTube)
    const featuredItems: FeaturedItem[] = [
        ...screenTracks.map(t => ({ type: 'screen' as const, track: t.track, identity: t.participantIdentity })),
        ...(isYouTubeActive ? [{ type: 'youtube' as const }] : [])
    ];

    const hasFeaturedContent = featuredItems.length > 0;

    return (
        <div className="fixed inset-0 bg-background flex flex-col overflow-hidden">
            {/* Featured Content (Unified Carousel) */}
            {hasFeaturedContent && (
                <div
                    className="w-full bg-muted flex-shrink-0 relative transition-all duration-300"
                    style={{ height: isParticipantsVisible ? 'calc(100% - 120px - 48px)' : 'calc(100% - 48px)' }}
                >
                    <ContentCarousel
                        items={featuredItems}
                        onYouTubeClose={() => setIsYouTubeActive(false)}
                        isUiVisible={isUiVisible}
                    />
                </div>
            )}

            {/* Participants strip (changes height based on featured content) */}
            <div
                className={`overflow-hidden transition-all duration-300 relative ${hasFeaturedContent && !isParticipantsVisible ? 'h-0' : hasFeaturedContent ? 'h-[120px] md:h-[200px]' : 'flex-1 pb-12 md:pb-14'
                    }`}
            >
                <VideoGrid
                    participants={participants.filter(p => !p.isLocal)}
                    localParticipant={localParticipant}
                    speakingParticipants={speakingParticipants}
                    raisedHands={raisedHands}
                    isScreenSharing={hasFeaturedContent}
                    callId={callId}
                />
            </div>

            {/* Collapse toggle bar - when participants are visible */}
            {hasFeaturedContent && isParticipantsVisible && (
                <button
                    onClick={() => setIsParticipantsVisible(false)}
                    className="fixed bottom-[calc(48px+120px)] md:bottom-[calc(56px+200px)] left-0 right-0 bg-card/30 hover:bg-card/95 hover:backdrop-blur-sm transition-all duration-200 flex items-center justify-center py-2 cursor-pointer group z-40 min-h-[44px]"
                    title="Скрыть участников"
                >
                    <div className="flex items-center gap-2 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
                        <div className="w-8 h-0.5 bg-border/50 group-hover:bg-border transition-colors rounded-full" />
                        <ChevronDown className="w-4 h-4" />
                        <div className="w-8 h-0.5 bg-border/50 group-hover:bg-border transition-colors rounded-full" />
                    </div>
                </button>
            )}

            {/* Expand toggle bar - when participants are hidden */}
            {hasFeaturedContent && !isParticipantsVisible && (
                <button
                    onClick={() => setIsParticipantsVisible(true)}
                    className="fixed bottom-12 md:bottom-14 left-0 right-0 bg-card/30 hover:bg-card/95 hover:backdrop-blur-sm transition-all duration-200 flex items-center justify-center py-2 cursor-pointer group z-40 min-h-[44px]"
                    title="Показать участников"
                >
                    <div className="flex items-center gap-2 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
                        <div className="w-8 h-0.5 bg-border/50 group-hover:bg-border transition-colors rounded-full" />
                        <ChevronUp className="w-4 h-4" />
                        <div className="w-8 h-0.5 bg-border/50 group-hover:bg-border transition-colors rounded-full" />
                    </div>
                </button>
            )}

            {/* Raised hands badge (only when participants are hidden) */}
            {hasFeaturedContent && !isParticipantsVisible && (
                <RaisedHandsBadge participants={participants} raisedHands={raisedHands} />
            )}

            {/* Control Panel - fixed at bottom */}
            <div className="fixed bottom-0 left-0 right-0 z-30">
                <ControlPanel
                    isCameraEnabled={localParticipant.isCameraEnabled}
                    isMicrophoneEnabled={localParticipant.isMicrophoneEnabled}
                    isScreenSharing={localParticipant.isScreenShareEnabled}
                    isChatOpen={isChatOpen}
                    isHandRaised={raisedHands.has(localParticipant.identity)}
                    isYouTubeActive={isYouTubeActive}
                    onToggleCamera={toggleCamera}
                    onToggleMicrophone={toggleMicrophone}
                    onToggleScreenShare={toggleScreenShare}
                    onToggleChat={() => setIsChatOpen(!isChatOpen)}
                    onToggleRaiseHand={toggleRaiseHand}
                    onToggleYouTube={() => setIsYouTubeActive(!isYouTubeActive)}
                    onLeave={onLeave}
                />
            </div>

            {/* Side Chat */}
            <ChatPanel
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                messages={messages}
                onSendMessage={sendMessage}
            />

            <RoomAudioRenderer />
        </div>
    );
};

const CallPage: React.FC = () => {
    const { callId } = useParams<{ callId: string }>();
    const [searchParams] = useSearchParams();
    const defaultName = searchParams.get('name') || '';

    const [token, setToken] = useState('');
    const [hasJoined, setHasJoined] = useState(false);

    const handleJoin = async (settings: { name: string, cameraEnabled: boolean, microphoneEnabled: boolean }) => {
        try {
            const t = await getToken(callId || 'default-room', settings.name);
            setToken(t);
            setHasJoined(true);
        } catch (e) {
            console.error("Failed to get token", e);
            alert("Failed to join room");
        }
    };

    if (!hasJoined) {
        return <PreCallSetup onJoin={handleJoin} defaultName={defaultName} />;
    }

    const getServerUrl = () => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const hostname = window.location.hostname;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'ws://localhost:7880';
        }
        
        return `${protocol}//${hostname}`;
    };

    return (
        <LiveKitRoom
            token={token}
            serverUrl={getServerUrl()}
            connect={true}
            video={true}
            audio={true}
            data-lk-theme="default"
            onDisconnected={() => window.location.href = '/'}
        >
            <CallContent onLeave={() => window.location.href = '/'} callId={callId || ''} />
        </LiveKitRoom>
    );
};

export default CallPage;
