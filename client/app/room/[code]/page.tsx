"use client";

import { useEffect, useState } from "react";
import GameApp from "@/components/GameApp";

interface RoomPageProps {
  params: Promise<{ code: string }> | { code: string };
}

export default function RoomPage({ params }: RoomPageProps) {
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function resolveCode() {
      const resolved = await Promise.resolve(params);
      if (active) {
        setCode(String(resolved.code || "").toUpperCase());
      }
    }

    void resolveCode();
    return () => {
      active = false;
    };
  }, [params]);

  if (!code) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-slate-400" dir="rtl">
        جاري فتح الغرفة…
      </div>
    );
  }

  return <GameApp initialRoomCode={code} />;
}
