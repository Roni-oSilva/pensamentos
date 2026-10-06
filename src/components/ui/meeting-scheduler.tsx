// components/ui/meeting-scheduler.tsx
"use client";

import * as React from "react";
import { useState } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isAfter,
  isBefore,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

/**
 * Agendador com calendário mensal (componente de origem: “meeting scheduler” do shadcn/ui).
 * Adaptado: português, semana começando no domingo, modo de data única e rótulo do interruptor configurável.
 */
interface MeetingSchedulerProps {
  /** Título do cartão. */
  title?: string;
  /** Texto curto abaixo do título. */
  description?: string;
  /** Texto do botão de confirmar. */
  scheduleButtonText?: string;
  /** Texto do botão de cancelar. */
  cancelButtonText?: string;
  /** Data inicial selecionada. */
  initialStartDate?: Date;
  /** Data final selecionada (modo intervalo). */
  initialEndDate?: Date;
  /** "range" escolhe início e fim; "single" escolhe só uma data. */
  mode?: "range" | "single";
  /** Rótulo do interruptor (some se não for informado). */
  switchLabel?: string;
  /** Valor inicial do interruptor. */
  initialSwitch?: boolean;
  /** Rótulos dos campos de data. */
  startLabel?: string;
  endLabel?: string;
  /** Texto do resumo; recebe as datas escolhidas. */
  summary?: (start: Date | null, end: Date | null) => string;
  /** Desabilita os botões (ex.: enquanto salva). */
  busy?: boolean;
  /** Chamado ao confirmar. `aiNotes` é o valor do interruptor (nome mantido do componente original). */
  onSchedule: (details: { startDate: Date | null; endDate: Date | null; aiNotes: boolean }) => void;
  /** Chamado ao cancelar. */
  onCancel: () => void;
}

const WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const fmt = (d: Date, f: string) => format(d, f, { locale: ptBR });
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const MeetingScheduler: React.FC<MeetingSchedulerProps> = ({
  title = "Agendar",
  description = "Escolha as datas no calendário.",
  scheduleButtonText = "Confirmar",
  cancelButtonText = "Cancelar",
  initialStartDate,
  initialEndDate,
  mode = "range",
  switchLabel,
  initialSwitch = false,
  startLabel = "Data de início*",
  endLabel = "Data de término*",
  summary,
  busy = false,
  onSchedule,
  onCancel,
}) => {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(initialStartDate || new Date()));
  const [startDate, setStartDate] = useState<Date | null>(initialStartDate || null);
  const [endDate, setEndDate] = useState<Date | null>(initialEndDate || null);
  const [aiNotes, setAiNotes] = useState(initialSwitch);
  const single = mode === "single";

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth)),
  });

  const handleDateClick = (day: Date) => {
    if (single) { setStartDate(day); setEndDate(null); return; }
    if (!startDate || (startDate && endDate)) {
      setStartDate(day);
      setEndDate(null);
    } else if (isBefore(day, startDate)) {
      setStartDate(day);
    } else {
      setEndDate(day);
    }
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const getEventSummary = () => {
    if (summary) return summary(startDate, endDate);
    if (!startDate) return "Escolha uma data para começar.";
    if (single || !endDate) return `Data: ${fmt(startDate, "d 'de' MMMM 'de' yyyy")}`;
    return `De ${fmt(startDate, "d 'de' MMM")} a ${fmt(endDate, "d 'de' MMM 'de' yyyy")}`;
  };

  const handleSchedule = () => onSchedule({ startDate, endDate, aiNotes });
  const ready = single ? !!startDate : !!startDate && !!endDate;

  return (
    <Card className="mx-auto w-full max-w-4xl overflow-hidden border-border bg-card/80 shadow-lg backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <CardHeader className="flex flex-row items-start gap-4 space-y-0">
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            <Clock className="h-6 w-6" aria-hidden />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-xl font-semibold">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-8 p-6 md:grid-cols-2">
          {/* Calendário */}
          <div className="flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <Button type="button" variant="ghost" size="icon" onClick={prevMonth} aria-label="Mês anterior">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <AnimatePresence mode="wait">
                <motion.h3
                  key={fmt(currentMonth, "MMMM yyyy")}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="text-center text-lg font-medium"
                >
                  {cap(fmt(currentMonth, "MMMM 'de' yyyy"))}
                </motion.h3>
              </AnimatePresence>
              <Button type="button" variant="ghost" size="icon" onClick={nextMonth} aria-label="Próximo mês">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            <div className="grid grid-cols-7 text-center text-xs text-muted-foreground">
              {WEEK.map((d) => <div key={d} className="py-2">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day) => {
                const isStart = !!startDate && isSameDay(day, startDate);
                const isEnd = !!endDate && isSameDay(day, endDate);
                const isInRange = !single && !!startDate && !!endDate && isAfter(day, startDate) && isBefore(day, endDate);
                return (
                  <motion.button
                    type="button"
                    key={day.toISOString()}
                    onClick={() => handleDateClick(day)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-pressed={isStart || isEnd}
                    aria-label={fmt(day, "d 'de' MMMM 'de' yyyy")}
                    className={cn(
                      "relative mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm transition-colors duration-200",
                      !isSameMonth(day, currentMonth) && "text-muted-foreground/50",
                      isSameDay(day, new Date()) && "font-bold underline underline-offset-4",
                      isInRange && "rounded-none bg-primary/15",
                      (isStart || isEnd) && "bg-primary text-primary-foreground",
                      !single && isStart && endDate && "rounded-r-none",
                      isEnd && "rounded-l-none",
                    )}
                  >
                    {fmt(day, "d")}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Campos */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">{startLabel}</Label>
                <div className="mt-2 flex items-center rounded-md border bg-background p-3">
                  <span className="flex-grow text-sm">{startDate ? fmt(startDate, "d 'de' MMMM 'de' yyyy") : "Escolha a data"}</span>
                  {startDate && <span className="rounded-md bg-primary/10 px-3 py-1 text-sm font-medium text-primary">{cap(fmt(startDate, "EEEE"))}</span>}
                </div>
              </div>
              {!single && (
                <div>
                  <Label className="text-sm font-medium">{endLabel}</Label>
                  <div className="mt-2 flex items-center rounded-md border bg-background p-3">
                    <span className="flex-grow text-sm">{endDate ? fmt(endDate, "d 'de' MMMM 'de' yyyy") : "Escolha a data"}</span>
                    {endDate && <span className="rounded-md bg-primary/10 px-3 py-1 text-sm font-medium text-primary">{cap(fmt(endDate, "EEEE"))}</span>}
                  </div>
                </div>
              )}
              {switchLabel && (
                <div className="flex items-center justify-between gap-4 pt-4">
                  <Label htmlFor="scheduler-switch" className="font-medium leading-snug">{switchLabel}</Label>
                  <Switch id="scheduler-switch" checked={aiNotes} onCheckedChange={setAiNotes} />
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <p className="mb-4 text-sm text-muted-foreground">{getEventSummary()}</p>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>{cancelButtonText}</Button>
                <Button type="button" onClick={handleSchedule} disabled={!ready || busy}>{scheduleButtonText}</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </motion.div>
    </Card>
  );
};
