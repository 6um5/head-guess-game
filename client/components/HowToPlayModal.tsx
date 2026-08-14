"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Shield, Swords, Users, X } from "lucide-react";
import CreditsCredit from "@/components/CreditsCredit";

interface HowToPlayModalProps {
  open: boolean;
  onClose: () => void;
}

export default function HowToPlayModal({ open, onClose }: HowToPlayModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/80 px-3 py-4 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-slate-900 p-5 shadow-2xl sm:p-6"
            dir="rtl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-lg font-bold text-white">
                  <BookOpen className="h-5 w-5 text-violet-300" />
                  شرح اللعبة بالكامل
                </p>
                <p className="mt-1 text-xs text-slate-400">حزر اللي براسي — أونلاين</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="touch-target rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300"
                aria-label="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-sm leading-relaxed text-slate-300">
              <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="mb-2 flex items-center gap-2 font-semibold text-violet-200">
                  <Shield className="h-4 w-4" />
                  الغرف محمية
                </p>
                <p>
                  الغرف حقيقية ومحمية. لا يدخل أحد إلا بكود الغرفة أو رابط مباشر يحتوي على الكود.
                  بدون الكود لا يمكن الدخول.
                </p>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="mb-2 flex items-center gap-2 font-semibold text-cyan-200">
                  <Users className="h-4 w-4" />
                  البداية
                </p>
                <ul className="list-disc space-y-1 pr-5">
                  <li>أنشئ غرفة أو انضم بكود/رابط.</li>
                  <li>المضيف يحدد حد الفوز (مثلاً 5 نقاط).</li>
                  <li>بعد بدء المباراة يختار المضيف لاعبين للمبارزة 1 ضد 1.</li>
                  <li>
                    مع 3 لاعبين أو أكثر، وضع «بالدور» يوزّع المبارزات بالعدل
                    ويظهر من عليه الدور القادم.
                  </li>
                  <li>لو خرجت أو حدّثت الصفحة، ترجع بنفس اسمك ونقاطك.</li>
                </ul>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="mb-2 flex items-center gap-2 font-semibold text-amber-200">
                  <Swords className="h-4 w-4" />
                  المبارزة
                </p>
                <ul className="list-disc space-y-1 pr-5">
                  <li>كل متبارز يحصل على كلمة/رقم مختلف.</li>
                  <li>كل لاعب يرى كلمته فقط (حتى المضيف إذا كان يلعب).</li>
                  <li>الجمهور يرى الكلمتين — والمضيف المتفرج أيضاً.</li>
                  <li>إذا المضيف ضد صديق: لا يرى كلمة الخصم، ويوافق فقط.</li>
                  <li>الخصمان يمكنهما اختيار كلمتين أو رقمين يدوياً.</li>
                  <li>تحزر كلمة خصمك في الشات — أول إجابة صحيحة تفوز بالجولة.</li>
                </ul>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="mb-2 font-semibold text-emerald-200">الكلمات والتلميحات</p>
                <ul className="list-disc space-y-1 pr-5">
                  <li>
                    الذكاء الاصطناعي يختار الكلمات ولا يكرر أي كلمة استُعملت في
                    نفس الغرفة.
                  </li>
                  <li>أو إدخال كلمة/رقم مخصص بموافقة المضيف.</li>
                  <li>التلميحات: يوافق المتبارزان أولاً، ثم يوافق المضيف أو يرفض.</li>
                  <li>
                    بعد الموافقة يطلب كل لاعب تلميحاً من خصمه — لأن خصمك هو من
                    يعرف كلمتك ويكتب لك التلميح.
                  </li>
                  <li>يوجد أيضاً تلميح ذكاء اصطناعي، لكنه صعب ومقصود الغموض.</li>
                  <li>لو اقترب تخمينك من الجواب تظهر لك إشارة «حار» أو «دافئ».</li>
                </ul>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="mb-2 font-semibold text-amber-200">لوحة المتصدرين</p>
                <ul className="list-disc space-y-1 pr-5">
                  <li>زر «المتصدرون» يظهر الترتيب في اللوبي وداخل المبارزة.</li>
                  <li>الترتيب حسب النقاط، ثم عدد الجولات الكاملة المكسوبة.</li>
                  <li>يظهر أيضاً من غادر الغرفة مع نقاطه المحفوظة.</li>
                </ul>
              </section>

              <div className="pt-1 text-center">
                <CreditsCredit />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
