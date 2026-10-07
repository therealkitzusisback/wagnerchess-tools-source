// Talks to a chess engine (Stockfish) that runs inside the visitor's own browser.
// Nothing is sent to a server. Messages use the standard "UCI" text protocol.

export type EngineLine = {
  multipv: number; // 1 = best line
  depth: number;
  cp: number | null; // centipawns, from White's point of view
  mate: number | null; // moves to mate, from White's point of view
  pv: string[]; // moves in UCI notation, e.g. "e2e4"
};

export type EngineJob = {
  fen: string;
  multipv: number;
  depth: number | null; // null = no depth limit
  movetimeMs?: number | null; // search for this long (used when depth is null); both null = search until stopped
  hash?: number; // memory in MB
  threads?: number; // processor cores (only for the multi-threaded engines)
  onLines: (lines: EngineLine[]) => void;
};

export class UciEngine {
  private worker: Worker;
  private state: "boot" | "idle" | "searching" | "stopping" = "boot";
  private current: EngineJob | null = null;
  private queued: EngineJob | null = null;
  private lines = new Map<number, EngineLine>();
  private whiteToMove = true;
  private multipvSet = 1;
  private hashSet = 0;
  private threadsSet = 0;
  private destroyed = false;

  constructor(
    url: string,
    private onReady: () => void,
    private onError: (message: string) => void
  ) {
    this.worker = new Worker(url);
    this.worker.onmessage = (e: MessageEvent) => {
      if (typeof e.data === "string") this.handle(e.data);
    };
    this.worker.onerror = (e) => {
      console.warn("Engine worker could not start:", url, e.message || "(no message)");
      this.onError("start");
    };
    this.send("uci");
  }

  private send(command: string) {
    if (!this.destroyed) this.worker.postMessage(command);
  }

  private handle(line: string) {
    if (line === "uciok") {
      this.send("isready");
    } else if (line === "readyok") {
      if (this.state === "boot") {
        this.state = "idle";
        this.onReady();
      }
      this.startQueued();
    } else if (line.startsWith("info ")) {
      if (this.state === "searching") this.parseInfo(line);
    } else if (line.startsWith("bestmove")) {
      if (this.state === "searching" || this.state === "stopping") {
        this.state = "idle";
        this.current = null;
        this.startQueued();
      }
    }
  }

  private parseInfo(line: string) {
    if (!this.current || line.includes("lowerbound") || line.includes("upperbound")) return;
    const t = line.split(" ");
    const read = (key: string) => {
      const i = t.indexOf(key);
      return i >= 0 ? t[i + 1] : undefined;
    };
    const pvIndex = t.indexOf("pv");
    const scoreIndex = t.indexOf("score");
    if (pvIndex < 0 || scoreIndex < 0) return;

    const multipv = Number(read("multipv") ?? "1");
    const depth = Number(read("depth") ?? "0");
    const kind = t[scoreIndex + 1];
    const value = Number(t[scoreIndex + 2]);
    if (!Number.isFinite(value)) return;
    const sign = this.whiteToMove ? 1 : -1; // engine scores are from the side to move

    this.lines.set(multipv, {
      multipv,
      depth,
      cp: kind === "cp" ? value * sign : null,
      mate: kind === "mate" ? value * sign : null,
      pv: t.slice(pvIndex + 1),
    });
    this.current.onLines([...this.lines.values()].sort((a, b) => a.multipv - b.multipv));
  }

  private startQueued() {
    if (this.state !== "idle" || !this.queued) return;
    const job = this.queued;
    this.queued = null;
    this.current = job;
    this.lines.clear();
    this.whiteToMove = job.fen.split(" ")[1] !== "b";
    if (job.multipv !== this.multipvSet) {
      this.send(`setoption name MultiPV value ${job.multipv}`);
      this.multipvSet = job.multipv;
    }
    if (job.hash && job.hash !== this.hashSet) {
      this.send(`setoption name Hash value ${job.hash}`);
      this.hashSet = job.hash;
    }
    if (job.threads && job.threads !== this.threadsSet) {
      this.send(`setoption name Threads value ${job.threads}`);
      this.threadsSet = job.threads;
    }
    this.send(`position fen ${job.fen}`);
    this.send(job.depth ? `go depth ${job.depth}` : job.movetimeMs ? `go movetime ${job.movetimeMs}` : "go infinite");
    this.state = "searching";
  }

  // Starts analysing a position. A running search is stopped first.
  analyse(job: EngineJob) {
    this.queued = job;
    if (this.state === "searching") {
      this.state = "stopping";
      this.send("stop");
    } else if (this.state === "idle") {
      this.startQueued();
    }
  }

  stop() {
    this.queued = null;
    if (this.state === "searching") {
      this.state = "stopping";
      this.send("stop");
    }
  }

  destroy() {
    this.destroyed = true;
    this.worker.terminate();
  }
}

export type EngineFileInfo = { file: string; sizeMB: number };
export type EngineManifest = {
  version: string;
  lite?: EngineFileInfo;
  full?: EngineFileInfo;
  liteMulti?: EngineFileInfo; // multi-threaded builds
  fullMulti?: EngineFileInfo;
};
