"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { connectSocket } from "@/lib/socket";
import type {
  AppScreen,
  ChatMessage,
  FighterInfo,
  GameErrorPayload,
  GameStatePayload,
  GameStatus,
  HintsState,
  KickedPayload,
  Player,
  PlayerRole,
  RoomErrorPayload,
  RoomUpdatedPayload,
  RoundClockState,
  RoundPhase,
  RoundStartedPayload,
  RoundWinner,
  RoundWinnerPayload,
  SessionPayload,
} from "@/types/game";

const EMPTY_HINTS: HintsState = {
  consentA: false,
  consentB: false,
  bothConsented: false,
  hostApproved: false,
  enabled: false,
  myHints: [],
  hintsForA: [],
  hintsForB: [],
  level: 0,
  maxRequests: 4,
  myRequests: 0,
  canRequestHint: false,
};

const EMPTY_CLOCK: RoundClockState = {
  enabled: false,
  durationSec: 60,
  endsAt: null,
  running: false,
  remainingSec: null,
};

function resolveScreen(
  roomCode: string | null,
  gameStatus: GameStatus,
): AppScreen {
  if (!roomCode) return "home";
  if (
    gameStatus === "playing" ||
    gameStatus === "round_end" ||
    gameStatus === "match_end"
  ) {
    return "game";
  }
  return "lobby";
}

export function useGameSocket() {
  const userIdRef = useRef<string | null>(null);
  const gameStatusRef = useRef<GameStatus>("waiting");
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [screen, setScreen] = useState<AppScreen>("home");
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameStatus, setGameStatus] = useState<GameStatus>("waiting");
  const [roundPhase, setRoundPhase] = useState<RoundPhase | null>(null);
  const [roundNumber, setRoundNumber] = useState(0);
  const [pointsToWin, setPointsToWin] = useState(5);
  const [category, setCategory] = useState<string | null>(null);
  const [isCustomRound, setIsCustomRound] = useState(false);
  const [customMode, setCustomMode] = useState<"words" | "numbers" | null>(
    null,
  );
  const [fighterA, setFighterA] = useState<FighterInfo | null>(null);
  const [fighterB, setFighterB] = useState<FighterInfo | null>(null);
  const [myRole, setMyRole] = useState<PlayerRole>("audience");
  const [myWord, setMyWord] = useState<string | null>(null);
  const [wordA, setWordA] = useState<string | null>(null);
  const [wordB, setWordB] = useState<string | null>(null);
  const [canSeeBothWords, setCanSeeBothWords] = useState(false);
  const [bothWordsReady, setBothWordsReady] = useState(false);
  const [hints, setHints] = useState<HintsState>(EMPTY_HINTS);
  const [roundClock, setRoundClock] = useState<RoundClockState>(EMPTY_CLOCK);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [roundWinner, setRoundWinner] = useState<RoundWinner | null>(null);
  const [matchWinner, setMatchWinner] = useState<RoundWinner | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showRoundStartedBanner, setShowRoundStartedBanner] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const resetToHome = useCallback((message?: string) => {
    gameStatusRef.current = "waiting";
    setRoomCode(null);
    setPlayers([]);
    setScreen("home");
    setGameStatus("waiting");
    setRoundPhase(null);
    setMessages([]);
    setRoundWinner(null);
    setMatchWinner(null);
    setCategory(null);
    setIsCustomRound(false);
    setCustomMode(null);
    setIsGeneratingAI(false);
    setShowRoundStartedBanner(false);
    setHints(EMPTY_HINTS);
    setRoundClock(EMPTY_CLOCK);
    setIsHost(false);
    if (message) setError(message);
  }, []);

  const syncPlayerMeta = useCallback((nextPlayers: Player[]) => {
    setPlayers(nextPlayers);
    const currentPlayer = nextPlayers.find(
      (player) => player.userId === userIdRef.current,
    );
    setIsHost(currentPlayer?.isHost ?? false);
  }, []);

  const applyGameState = useCallback(
    (payload: GameStatePayload, activeRoomCode: string | null) => {
      gameStatusRef.current = payload.status;
      setGameStatus(payload.status);
      setRoundPhase(payload.roundPhase);
      setRoundNumber(payload.roundNumber ?? 0);
      setPointsToWin(payload.pointsToWin ?? 5);
      setCategory(payload.category ?? null);
      setIsCustomRound(payload.isCustomRound ?? false);
      setCustomMode(payload.customMode ?? null);
      setFighterA(payload.fighterA);
      setFighterB(payload.fighterB);
      setMyRole(payload.myRole);
      setMyWord(payload.myWord);
      setWordA(payload.wordA);
      setWordB(payload.wordB);
      setCanSeeBothWords(payload.canSeeBothWords);
      setBothWordsReady(payload.bothWordsReady ?? false);
      setHints(payload.hints ?? EMPTY_HINTS);
      setRoundClock(payload.roundClock ?? EMPTY_CLOCK);
      setMessages(payload.messages);
      setRoundWinner(payload.roundWinner);
      setMatchWinner(payload.matchWinner);
      syncPlayerMeta(payload.players);
      setScreen(resolveScreen(activeRoomCode, payload.status));

      if (payload.roundPhase !== "selecting") {
        setIsGeneratingAI(false);
      }
    },
    [syncPlayerMeta],
  );

  useEffect(() => {
    const socket = connectSocket();

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    const handleSession = (payload: SessionPayload) => {
      userIdRef.current = payload.userId;
      setSession(payload);
    };

    const handleRoomUpdated = (payload: RoomUpdatedPayload) => {
      setRoomCode(payload.roomCode);
      syncPlayerMeta(payload.players);
      setError(null);
      setScreen(resolveScreen(payload.roomCode, gameStatusRef.current));
    };

    const handleGameState = (payload: GameStatePayload) => {
      setRoomCode((currentRoomCode) => {
        applyGameState(payload, currentRoomCode);
        return currentRoomCode;
      });
    };

    const handleRoomError = (payload: RoomErrorPayload) => {
      setIsGeneratingAI(false);
      setError(payload.message);
    };

    const handleGameError = (payload: GameErrorPayload) => {
      setIsGeneratingAI(false);
      setError(payload.message);
    };

    const handleGuessMessage = (payload: ChatMessage) => {
      setMessages((current) => {
        if (current.some((message) => message.id === payload.id)) return current;
        return [...current, payload];
      });
    };

    const handleRoundStarted = (payload: RoundStartedPayload) => {
      setIsGeneratingAI(false);
      setCategory(payload.category);
      setRoundNumber(payload.roundNumber);
      setFighterA(payload.fighterA);
      setFighterB(payload.fighterB);
      setStatusMessage(payload.message);
      setShowRoundStartedBanner(true);
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = setTimeout(() => {
        setShowRoundStartedBanner(false);
      }, 4500);
    };

    const handleRoundWinner = (payload: RoundWinnerPayload) => {
      setRoundWinner(payload.winner);
      setWordA(payload.wordA);
      setWordB(payload.wordB);
      setStatusMessage(
        payload.matchOver
          ? `${payload.winner.username} فاز بالمباراة!`
          : `${payload.winner.username} فاز بالجولة!`,
      );
      if (payload.matchOver) setMatchWinner(payload.winner);
    };

    const handleRoundSkipped = () => {
      setStatusMessage("المضيف تخطى الجولة.");
      setShowRoundStartedBanner(false);
      setIsGeneratingAI(false);
    };

    const handleKicked = (payload: KickedPayload) => {
      resetToHome(payload.message);
    };

    const handleLeftRoom = () => {
      resetToHome();
      setError(null);
    };

    const handleHintConsentUpdated = (payload: {
      consentA: boolean;
      consentB: boolean;
      bothConsented: boolean;
    }) => {
      setHints((current) => ({
        ...current,
        consentA: payload.consentA,
        consentB: payload.consentB,
        bothConsented: payload.bothConsented,
      }));
    };

    const handleHintsEnabled = (payload: { message: string }) => {
      setHints((current) => ({
        ...current,
        enabled: true,
        hostApproved: true,
      }));
      setStatusMessage(payload.message);
    };

    const handleHintsRejected = (payload: { message: string }) => {
      setHints(EMPTY_HINTS);
      setStatusMessage(payload.message);
    };

    const handleHintsUpdated = (payload: { message: string }) => {
      setStatusMessage(payload.message);
    };

    const handleRoundTimedOut = (payload: {
      message: string;
      wordA?: string;
      wordB?: string;
    }) => {
      setStatusMessage(payload.message);
      if (payload.wordA) setWordA(payload.wordA);
      if (payload.wordB) setWordB(payload.wordB);
      setRoundClock((current) => ({
        ...current,
        running: false,
        endsAt: null,
        remainingSec: 0,
      }));
    };

    const handleRoundTimerUpdated = (payload: { message: string }) => {
      setStatusMessage(payload.message);
    };

    const handleBecameHost = (payload: { message: string }) => {
      setIsHost(true);
      setStatusMessage(payload.message);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("session", handleSession);
    socket.on("roomUpdated", handleRoomUpdated);
    socket.on("gameState", handleGameState);
    socket.on("roomError", handleRoomError);
    socket.on("gameError", handleGameError);
    socket.on("guessMessage", handleGuessMessage);
    socket.on("roundStarted", handleRoundStarted);
    socket.on("roundWinner", handleRoundWinner);
    socket.on("roundSkipped", handleRoundSkipped);
    socket.on("roundTimedOut", handleRoundTimedOut);
    socket.on("roundTimerUpdated", handleRoundTimerUpdated);
    socket.on("kicked", handleKicked);
    socket.on("leftRoom", handleLeftRoom);
    socket.on("becameHost", handleBecameHost);
    socket.on("hintsEnabled", handleHintsEnabled);
    socket.on("hintsRejected", handleHintsRejected);
    socket.on("hintsUpdated", handleHintsUpdated);
    socket.on("hintConsentUpdated", handleHintConsentUpdated);

    if (socket.connected) setIsConnected(true);

    return () => {
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("session", handleSession);
      socket.off("roomUpdated", handleRoomUpdated);
      socket.off("gameState", handleGameState);
      socket.off("roomError", handleRoomError);
      socket.off("gameError", handleGameError);
      socket.off("guessMessage", handleGuessMessage);
      socket.off("roundStarted", handleRoundStarted);
      socket.off("roundWinner", handleRoundWinner);
      socket.off("roundSkipped", handleRoundSkipped);
      socket.off("roundTimedOut", handleRoundTimedOut);
      socket.off("roundTimerUpdated", handleRoundTimerUpdated);
      socket.off("kicked", handleKicked);
      socket.off("leftRoom", handleLeftRoom);
      socket.off("becameHost", handleBecameHost);
      socket.off("hintsEnabled", handleHintsEnabled);
      socket.off("hintsRejected", handleHintsRejected);
      socket.off("hintsUpdated", handleHintsUpdated);
      socket.off("hintConsentUpdated", handleHintConsentUpdated);
    };
  }, [applyGameState, resetToHome, syncPlayerMeta]);

  const createRoom = useCallback((username: string) => {
    setError(null);
    connectSocket().emit("createRoom", { username });
  }, []);

  const joinRoom = useCallback((username: string, code: string) => {
    setError(null);
    connectSocket().emit("joinRoom", { username, roomCode: code });
  }, []);

  const leaveRoom = useCallback(() => {
    connectSocket().emit("leaveRoom");
  }, []);

  const startGame = useCallback(
    (winPoints?: number) => {
      setError(null);
      connectSocket().emit("startGame", {
        pointsToWin: winPoints ?? pointsToWin,
      });
    },
    [pointsToWin],
  );

  const updatePointsToWin = useCallback((value: number) => {
    setPointsToWin(value);
    connectSocket().emit("setPointsToWin", { pointsToWin: value });
  }, []);

  const startDuel = useCallback(
    (payload: {
      category: string;
      random?: boolean;
      playerAId?: string;
      playerBId?: string;
    }) => {
      setError(null);
      setIsGeneratingAI(true);
      connectSocket().emit("startDuel", payload);
    },
    [],
  );

  const startCustomDuel = useCallback(
    (payload: {
      random?: boolean;
      playerAId?: string;
      playerBId?: string;
      mode?: "words" | "numbers";
    }) => {
      setError(null);
      connectSocket().emit("startCustomDuel", payload);
    },
    [],
  );

  const proposeWord = useCallback((word: string) => {
    connectSocket().emit("proposeWord", { word });
  }, []);

  const hostSetWord = useCallback((targetUserId: string, word: string) => {
    connectSocket().emit("hostSetWord", { targetUserId, word });
  }, []);

  const approveCustomWords = useCallback(() => {
    connectSocket().emit("approveCustomWords");
  }, []);

  const cancelCustomSetup = useCallback(() => {
    connectSocket().emit("cancelCustomSetup");
  }, []);

  const consentHints = useCallback(
    (allow: boolean) => {
      const consented = allow !== false;
      setHints((current) => {
        const next = { ...current };
        if (myRole === "fighterA") next.consentA = consented;
        if (myRole === "fighterB") next.consentB = consented;
        next.bothConsented = Boolean(next.consentA && next.consentB);
        return next;
      });
      connectSocket().emit("consentHints", { allow: consented });
    },
    [myRole],
  );

  const approveHints = useCallback(() => {
    setHints((current) => ({
      ...current,
      hostApproved: true,
      enabled: true,
    }));
    connectSocket().emit("approveHints");
  }, []);

  const rejectHints = useCallback(() => {
    setHints(EMPTY_HINTS);
    connectSocket().emit("rejectHints");
  }, []);

  const requestPersonalHint = useCallback(() => {
    connectSocket().emit("requestPersonalHint");
  }, []);

  const setRoundTimer = useCallback(
    (payload: { enabled: boolean; durationSec?: number }) => {
      setRoundClock((current) => ({
        ...current,
        enabled: payload.enabled,
        durationSec: payload.durationSec ?? current.durationSec,
      }));
      connectSocket().emit("setRoundTimer", payload);
    },
    [],
  );

  const returnToLobby = useCallback(() => {
    setError(null);
    gameStatusRef.current = "waiting";
    setGameStatus("waiting");
    setRoundPhase(null);
    setRoundWinner(null);
    setMatchWinner(null);
    setCategory(null);
    setIsCustomRound(false);
    setCustomMode(null);
    setFighterA(null);
    setFighterB(null);
    setMyWord(null);
    setWordA(null);
    setWordB(null);
    setMessages([]);
    setHints(EMPTY_HINTS);
    setRoundClock(EMPTY_CLOCK);
    setShowRoundStartedBanner(false);
    setIsGeneratingAI(false);
    setScreen("lobby");
    connectSocket().emit("returnToLobby");
  }, []);

  const sendGuess = useCallback((message: string) => {
    connectSocket().emit("sendGuess", { message });
  }, []);

  const skipRound = useCallback(() => {
    setError(null);
    connectSocket().emit("skipRound");
  }, []);

  const kickPlayer = useCallback((userId: string) => {
    setError(null);
    connectSocket().emit("kickPlayer", { userId });
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const currentUserId = session?.userId ?? null;
  const isFighter = myRole === "fighterA" || myRole === "fighterB";
  const canGuess = roundPhase === "guessing" && isFighter;

  return {
    screen,
    session,
    roomCode,
    players,
    isHost,
    error,
    isConnected,
    gameStatus,
    roundPhase,
    roundNumber,
    pointsToWin,
    category,
    isCustomRound,
    customMode,
    fighterA,
    fighterB,
    myRole,
    myWord,
    wordA,
    wordB,
    canSeeBothWords,
    bothWordsReady,
    hints,
    roundClock,
    messages,
    roundWinner,
    matchWinner,
    statusMessage,
    showRoundStartedBanner,
    isGeneratingAI,
    isFighter,
    canGuess,
    currentUserId,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    updatePointsToWin,
    startDuel,
    startCustomDuel,
    proposeWord,
    hostSetWord,
    approveCustomWords,
    cancelCustomSetup,
    consentHints,
    approveHints,
    rejectHints,
    requestPersonalHint,
    setRoundTimer,
    returnToLobby,
    sendGuess,
    skipRound,
    kickPlayer,
    clearError,
  };
}
