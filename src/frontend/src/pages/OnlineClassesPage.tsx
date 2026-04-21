import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/lib/api";
import { isDemoMode } from "@/lib/demoMode";
import { getSessions, updateSession } from "@/lib/onlineClassesStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  ExternalLink,
  Mic,
  MicOff,
  MonitorPlay,
  Play,
  PlusCircle,
  Square,
  Users,
  Video,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

type OnlineSession = {
  id: string;
  title: string;
  subject: string;
  teacher?: string;
  day?: string;
  time?: string;
  duration?: string;
  joinUrl?: string;
  joinLink?: string;
  scheduledAt?: string;
  status: "live" | "scheduled" | "ended";
  recordingUrl?: string;
  participants?: number;
};

const DAYS_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const statusBadge: Record<OnlineSession["status"], string> = {
  live: "bg-success/10 text-success border-success/30",
  scheduled: "bg-primary/10 text-primary border-primary/30",
  ended: "bg-muted text-muted-foreground border-border",
};

const EMPTY_FORM = {
  subject: "",
  title: "",
  day: "Monday",
  time: "",
  duration: "",
  joinUrl: "",
};

function useOnlineSessions() {
  return useQuery<OnlineSession[]>({
    queryKey: ["online-classes"],
    queryFn: async () => {
      if (isDemoMode()) {
        const sessions = getSessions();
        return sessions.map((s) => ({
          ...s,
          title: s.subject,
          joinUrl: s.joinLink,
        }));
      }
      const res = await api.get<OnlineSession[]>("/online-classes");
      if (!res.success) throw new Error(res.error ?? "Failed to load sessions");
      return res.data ?? [];
    },
  });
}

export default function OnlineClassesPage() {
  const qc = useQueryClient();
  const { data: sessions = [], isLoading } = useOnlineSessions();
  const [sessionActive, setSessionActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const byDay = DAYS_FULL.map((day) => ({
    day,
    sessions: sessions.filter(
      (s) => s.day === day || s.day?.toLowerCase() === day.toLowerCase(),
    ),
  }));

  const createMutation = useMutation({
    mutationFn: async (data: typeof EMPTY_FORM) => {
      if (isDemoMode()) {
        return {
          id: `demo-${Date.now()}`,
          ...data,
          status: "scheduled" as const,
        };
      }
      const res = await api.post<OnlineSession>("/online-classes", {
        title: data.subject,
        subject: data.subject,
        day: data.day,
        time: data.time,
        duration: data.duration,
        joinUrl: data.joinUrl,
        status: "scheduled",
      });
      if (!res.success)
        throw new Error(res.error ?? "Failed to create session");
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["online-classes"] });
      toast.success("Session created");
      setAddOpen(false);
      setForm(EMPTY_FORM);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: { id: string; data: Partial<OnlineSession> }) => {
      if (isDemoMode()) {
        updateSession(id, { status: data.status, joinLink: data.joinUrl });
        return;
      }
      const res = await api.put<OnlineSession>(`/online-classes/${id}`, data);
      if (!res.success)
        throw new Error(res.error ?? "Failed to update session");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["online-classes"] });
      toast.success("Session updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const _deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isDemoMode()) return;
      const res = await api.delete(`/online-classes/${id}`);
      if (!res.success)
        throw new Error(res.error ?? "Failed to delete session");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["online-classes"] });
      toast.info("Session removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleJoin(s: OnlineSession) {
    const url = s.joinUrl ?? s.joinLink;
    if (!url) {
      toast.error("No meeting link has been set for this class yet.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleAddSession() {
    if (!form.subject.trim()) {
      toast.error("Subject is required");
      return;
    }
    createMutation.mutate(form);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Online Classes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage virtual sessions, recordings, and teacher controls
          </p>
        </div>
        <Button
          size="sm"
          className="gap-2"
          onClick={() => setAddOpen(true)}
          data-ocid="online_classes.add.open_modal_button"
        >
          <PlusCircle className="w-4 h-4" /> Add Session
        </Button>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent
          className="sm:max-w-md"
          data-ocid="online_classes.add.dialog"
        >
          <DialogHeader>
            <DialogTitle>New Online Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Subject *</Label>
                <Input
                  value={form.subject}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, subject: e.target.value }))
                  }
                  placeholder="e.g. Mathematics"
                  className="h-8 text-xs"
                  data-ocid="online_classes.subject.input"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Day</Label>
                <Select
                  value={form.day}
                  onValueChange={(v) => setForm((f) => ({ ...f, day: v }))}
                >
                  <SelectTrigger
                    className="h-8 text-xs"
                    data-ocid="online_classes.day.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_FULL.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Time</Label>
                <Input
                  value={form.time}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, time: e.target.value }))
                  }
                  placeholder="8:00 AM"
                  className="h-8 text-xs"
                  data-ocid="online_classes.time.input"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Duration</Label>
                <Input
                  value={form.duration}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, duration: e.target.value }))
                  }
                  placeholder="60 min"
                  className="h-8 text-xs"
                  data-ocid="online_classes.duration.input"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Meeting URL (optional)</Label>
              <Input
                value={form.joinUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, joinUrl: e.target.value }))
                }
                placeholder="https://zoom.us/j/..."
                className="h-8 text-xs"
                data-ocid="online_classes.joinurl.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddOpen(false)}
              data-ocid="online_classes.add.cancel_button"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddSession}
              disabled={createMutation.isPending}
              data-ocid="online_classes.add.confirm_button"
            >
              {createMutation.isPending ? "Creating..." : "Create Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="schedule">
        <TabsList data-ocid="online_classes.tab">
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="recordings">Recordings</TabsTrigger>
          <TabsTrigger value="controls">Teacher Controls</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="mt-6 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  className="h-24 rounded-xl"
                  data-ocid="online_classes.loading_state"
                />
              ))}
            </div>
          ) : (
            byDay.map((group, gi) => (
              <motion.div
                key={group.day}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: gi * 0.05 }}
                className="bg-card rounded-xl border border-border shadow-card overflow-hidden"
              >
                <div className="bg-muted/40 px-5 py-3 border-b border-border">
                  <h3 className="font-semibold text-sm text-foreground">
                    {group.day}
                  </h3>
                </div>
                {group.sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-5 py-4">
                    No sessions scheduled
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {group.sessions.map((s, si) => {
                      const url = s.joinUrl ?? s.joinLink;
                      const isJoinable = s.status === "live" && !!url;
                      return (
                        <div
                          key={s.id}
                          className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-3"
                          data-ocid={`online_classes.item.${gi * 5 + si + 1}`}
                        >
                          <div className="flex-1">
                            <p className="font-medium text-foreground text-sm">
                              {s.subject ?? s.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {[s.teacher, s.time, s.duration]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {s.participants != null && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="w-3.5 h-3.5" />{" "}
                                {s.participants}
                              </span>
                            )}
                            <Badge
                              variant="outline"
                              className={`text-xs capitalize ${statusBadge[s.status]}`}
                            >
                              {s.status}
                            </Badge>
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Button
                                      size="sm"
                                      variant={
                                        isJoinable ? "default" : "outline"
                                      }
                                      className="text-xs h-7 gap-1"
                                      disabled={!isJoinable}
                                      onClick={() => handleJoin(s)}
                                      data-ocid={`online_classes.join.${gi * 5 + si + 1}.button`}
                                    >
                                      <ExternalLink className="w-3 h-3" /> Join
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                {!isJoinable && (
                                  <TooltipContent
                                    side="top"
                                    className="text-xs max-w-[180px] text-center"
                                  >
                                    {!url
                                      ? "No meeting link set"
                                      : "Class is not live yet"}
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                            {s.status === "ended" && s.recordingUrl && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs h-7 gap-1"
                                onClick={() =>
                                  window.open(s.recordingUrl, "_blank")
                                }
                                data-ocid={`online_classes.recording.${gi * 5 + si + 1}.button`}
                              >
                                <Play className="w-3 h-3" /> Recording
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </TabsContent>

        <TabsContent value="recordings" className="mt-6">
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="font-semibold text-foreground">Past Recordings</h2>
            </div>
            <div className="overflow-x-auto">
              <Table data-ocid="online_classes.recordings.table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Session</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Recording</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    (["a", "b", "c"] as const).map((k) => (
                      <TableRow key={`skel-${k}`}>
                        <TableCell colSpan={4}>
                          <Skeleton className="h-8" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : sessions.filter((s) => s.status === "ended").length ===
                    0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground py-8"
                        data-ocid="online_classes.recordings.empty_state"
                      >
                        <MonitorPlay className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No recordings available</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sessions
                      .filter((s) => s.status === "ended")
                      .map((s, i) => (
                        <TableRow
                          key={s.id}
                          data-ocid={`online_classes.recording.item.${i + 1}`}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <MonitorPlay className="w-4 h-4 text-primary" />
                              </div>
                              <span className="font-medium text-sm">
                                {s.subject ?? s.title}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {s.day ?? "–"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-xs ${statusBadge[s.status]}`}
                            >
                              {s.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {s.recordingUrl ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 gap-1 text-xs"
                                onClick={() =>
                                  window.open(s.recordingUrl, "_blank")
                                }
                                data-ocid={`online_classes.play.${i + 1}.button`}
                              >
                                <Play className="w-3.5 h-3.5" /> Play
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                No recording
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="controls" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="bg-card rounded-xl border border-border shadow-card p-6 space-y-5">
              <div>
                <h2 className="font-semibold text-foreground">
                  Active Session Panel
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Manage your live class session
                </p>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/40 border border-border">
                <div
                  className={`w-3 h-3 rounded-full ${sessionActive ? "bg-success animate-pulse" : "bg-muted-foreground/30"}`}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {sessionActive ? "Session Active" : "No Active Session"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {!sessionActive ? (
                  <Button
                    className="gap-2"
                    onClick={() => {
                      setSessionActive(true);
                      toast.success("Session started");
                    }}
                    data-ocid="online_classes.start_session.button"
                  >
                    <Video className="w-4 h-4" /> Start Session
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    className="gap-2"
                    onClick={() => {
                      setSessionActive(false);
                      toast.info("Session ended");
                    }}
                    data-ocid="online_classes.stop_session.button"
                  >
                    <Square className="w-4 h-4" /> Stop Session
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    setMuted((m) => !m);
                    toast.info(muted ? "Unmuted all" : "Muted all");
                  }}
                  data-ocid="online_classes.mute_all.button"
                >
                  {muted ? (
                    <Mic className="w-4 h-4" />
                  ) : (
                    <MicOff className="w-4 h-4" />
                  )}
                  {muted ? "Unmute All" : "Mute All"}
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => toast.info("Share screen started")}
                  data-ocid="online_classes.share_screen.button"
                >
                  <Camera className="w-4 h-4" /> Share Screen
                </Button>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-card p-6">
              <h2 className="font-semibold text-foreground mb-4">
                Live / Upcoming Sessions
              </h2>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.slice(0, 3).map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {s.subject ?? s.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {s.time ?? s.scheduledAt ?? "–"}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs ${statusBadge[s.status]}`}
                      >
                        {s.status}
                      </Badge>
                    </div>
                  ))}
                  {sessions.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No sessions
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Session management table */}
          <div className="mt-6 bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="font-semibold text-foreground">All Sessions</h2>
            </div>
            <div className="overflow-x-auto">
              <Table data-ocid="online_classes.sessions.table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Change Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.length === 0 && !isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground py-8"
                        data-ocid="online_classes.sessions.empty_state"
                      >
                        No sessions yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    sessions.map((s, i) => (
                      <TableRow
                        key={s.id}
                        data-ocid={`online_classes.session.item.${i + 1}`}
                      >
                        <TableCell className="font-medium text-sm">
                          {s.subject ?? s.title}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {s.day ?? "–"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs capitalize ${statusBadge[s.status]}`}
                          >
                            {s.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Select
                            value={s.status}
                            onValueChange={(v) =>
                              updateMutation.mutate({
                                id: s.id,
                                data: { status: v as OnlineSession["status"] },
                              })
                            }
                          >
                            <SelectTrigger
                              className="h-7 text-xs w-32 ml-auto"
                              data-ocid={`online_classes.status.${i + 1}.select`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="scheduled">
                                Scheduled
                              </SelectItem>
                              <SelectItem value="live">Live</SelectItem>
                              <SelectItem value="ended">Ended</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
