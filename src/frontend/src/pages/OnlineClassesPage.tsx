import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Camera,
  Download,
  ExternalLink,
  Mic,
  MicOff,
  MonitorPlay,
  Play,
  Square,
  Users,
  Video,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

type VirtualSession = {
  id: string;
  subject: string;
  teacher: string;
  day: string;
  time: string;
  duration: string;
  participants: number;
  status: "live" | "scheduled" | "ended";
  joinLink: string;
};

type Recording = {
  id: string;
  subject: string;
  teacher: string;
  date: string;
  duration: string;
  size: string;
};

const mockSessions: VirtualSession[] = [
  {
    id: "s1",
    subject: "Mathematics",
    teacher: "Mr. Adebayo",
    day: "Monday",
    time: "8:00 AM",
    duration: "60 min",
    participants: 28,
    status: "live",
    joinLink: "#",
  },
  {
    id: "s2",
    subject: "English Literature",
    teacher: "Mrs. Okafor",
    day: "Monday",
    time: "10:00 AM",
    duration: "60 min",
    participants: 31,
    status: "scheduled",
    joinLink: "#",
  },
  {
    id: "s3",
    subject: "Physics",
    teacher: "Dr. Nwosu",
    day: "Tuesday",
    time: "9:00 AM",
    duration: "90 min",
    participants: 24,
    status: "scheduled",
    joinLink: "#",
  },
  {
    id: "s4",
    subject: "Chemistry",
    teacher: "Ms. Eze",
    day: "Wednesday",
    time: "11:00 AM",
    duration: "60 min",
    participants: 27,
    status: "scheduled",
    joinLink: "#",
  },
  {
    id: "s5",
    subject: "Biology",
    teacher: "Mr. Chukwu",
    day: "Thursday",
    time: "2:00 PM",
    duration: "60 min",
    participants: 30,
    status: "scheduled",
    joinLink: "#",
  },
  {
    id: "s6",
    subject: "History",
    teacher: "Mrs. Bello",
    day: "Friday",
    time: "9:00 AM",
    duration: "45 min",
    participants: 26,
    status: "scheduled",
    joinLink: "#",
  },
];

const mockRecordings: Recording[] = [
  {
    id: "r1",
    subject: "Mathematics – Quadratics",
    teacher: "Mr. Adebayo",
    date: "2026-03-25",
    duration: "58 min",
    size: "420 MB",
  },
  {
    id: "r2",
    subject: "English – Poetry Analysis",
    teacher: "Mrs. Okafor",
    date: "2026-03-24",
    duration: "62 min",
    size: "510 MB",
  },
  {
    id: "r3",
    subject: "Physics – Newton's Laws",
    teacher: "Dr. Nwosu",
    date: "2026-03-22",
    duration: "88 min",
    size: "730 MB",
  },
  {
    id: "r4",
    subject: "Chemistry – Organic Reactions",
    teacher: "Ms. Eze",
    date: "2026-03-20",
    duration: "55 min",
    size: "390 MB",
  },
  {
    id: "r5",
    subject: "Biology – Cell Division",
    teacher: "Mr. Chukwu",
    date: "2026-03-18",
    duration: "60 min",
    size: "480 MB",
  },
];

const statusBadge: Record<VirtualSession["status"], string> = {
  live: "bg-success/10 text-success border-success/30",
  scheduled: "bg-primary/10 text-primary border-primary/30",
  ended: "bg-muted text-muted-foreground border-border",
};

export default function OnlineClassesPage() {
  const [sessionActive, setSessionActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [participants] = useState(18);

  const byDay = DAYS.map((day) => ({
    day,
    sessions: mockSessions.filter((s) => s.day === day),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-xl font-bold text-foreground">Online Classes</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage virtual sessions, recordings, and teacher controls
        </p>
      </div>

      <Tabs defaultValue="schedule">
        <TabsList data-ocid="online_classes.tab">
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="recordings">Recordings</TabsTrigger>
          <TabsTrigger value="controls">Teacher Controls</TabsTrigger>
        </TabsList>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="mt-6 space-y-4">
          {byDay.map((group, gi) => (
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
                  {group.sessions.map((s, si) => (
                    <div
                      key={s.id}
                      className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-3"
                      data-ocid={`online_classes.item.${gi * 5 + si + 1}`}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">
                          {s.subject}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {s.teacher} · {s.time} · {s.duration}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="w-3.5 h-3.5" /> {s.participants}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize ${statusBadge[s.status]}`}
                        >
                          {s.status}
                        </Badge>
                        <Button
                          size="sm"
                          variant={s.status === "live" ? "default" : "outline"}
                          className="text-xs h-7 gap-1"
                          onClick={() =>
                            toast.info(`Joining ${s.subject} class...`)
                          }
                          data-ocid={`online_classes.join.${gi * 5 + si + 1}.button`}
                        >
                          <ExternalLink className="w-3 h-3" /> Join
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </TabsContent>

        {/* Recordings Tab */}
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
                    <TableHead className="hidden md:table-cell">
                      Teacher
                    </TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="hidden sm:table-cell">Size</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRecordings.map((rec, i) => (
                    <TableRow
                      key={rec.id}
                      data-ocid={`online_classes.recording.item.${i + 1}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <MonitorPlay className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-medium text-sm">
                            {rec.subject}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {rec.teacher}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {rec.date}
                      </TableCell>
                      <TableCell className="text-sm">{rec.duration}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {rec.size}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => toast.info(`Playing ${rec.subject}`)}
                            data-ocid={`online_classes.play.${i + 1}.button`}
                          >
                            <Play className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() =>
                              toast.success(
                                `Downloading ${rec.subject} recording`,
                              )
                            }
                            data-ocid={`online_classes.download.${i + 1}.button`}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* Teacher Controls Tab */}
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
                  {sessionActive && (
                    <p className="text-xs text-muted-foreground">
                      {participants} participants connected
                    </p>
                  )}
                </div>
                {sessionActive && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="w-3.5 h-3.5" /> {participants}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {!sessionActive ? (
                  <Button
                    className="gap-2"
                    onClick={() => {
                      setSessionActive(true);
                      toast.success("Session started successfully");
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
                    toast.info(
                      muted
                        ? "All participants unmuted"
                        : "All participants muted",
                    );
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
                Upcoming Sessions Today
              </h2>
              <div className="space-y-3">
                {mockSessions.slice(0, 3).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{s.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.time} · {s.duration}
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
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
