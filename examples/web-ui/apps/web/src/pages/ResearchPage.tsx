import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Search,
  Loader2,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  History,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useResearchStore } from "@/stores";
import {
  streamResearch,
  fetchResearchSessions,
  fetchResearchSession,
  fetchKnowledgeFiles,
} from "@/services/api";
import { useRecentInputs } from "@/hooks/useRecentInputs";
import { RecentInputPopover } from "@/components/RecentInputPopover";
import type { ResearchSession, ResearchStreamChunk } from "@deepagents/shared";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ResearchPage() {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const [question, setQuestion] = useState("");
  const [knowledgeFiles, setKnowledgeFiles] = useState<Array<{ name: string }>>(
    [],
  );
  const [showHistory, setShowHistory] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { recentInputs, addRecentInput } = useRecentInputs();

  const {
    sessions,
    currentSession,
    isLoading,
    streamChunks,
    setSessions,
    setCurrentSession,
    setIsLoading,
    addStreamChunk,
    clearStreamChunks,
    setAbortController,
    abortResearch,
  } = useResearchStore();

  // Load sessions and knowledge files on mount
  useEffect(() => {
    loadSessions();
    loadKnowledgeFiles();
  }, []);

  // Load specific session if sessionId is provided
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    }
  }, [sessionId]);

  const loadSessions = async () => {
    try {
      const data = await fetchResearchSessions();
      setSessions(data);
    } catch (error) {
      toast.error("加载会话列表失败");
    }
  };

  const loadSession = async (id: string) => {
    try {
      const data = await fetchResearchSession(id);
      setCurrentSession(data);
    } catch (error) {
      toast.error("加载会话失败");
    }
  };

  const loadKnowledgeFiles = async () => {
    try {
      const files = await fetchKnowledgeFiles();
      setKnowledgeFiles(files);
    } catch (error) {
      console.error("Failed to load knowledge files:", error);
    }
  };

  const handleStartResearch = useCallback(async () => {
    if (!question.trim()) {
      toast.error("请输入研究问题");
      return;
    }

    // Save to recent inputs
    addRecentInput(question.trim());

    setIsLoading(true);
    clearStreamChunks();

    const abortController = new AbortController();
    setAbortController(abortController);

    try {
      await streamResearch(
        { question: question.trim() },
        (chunk: ResearchStreamChunk) => {
          addStreamChunk(chunk);
        },
        abortController.signal,
      );

      toast.success("研究完成");
      loadSessions(); // Refresh sessions list
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        toast.info("研究已取消");
      } else {
        toast.error(
          "研究失败: " + (error instanceof Error ? error.message : "未知错误"),
        );
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  }, [
    question,
    setIsLoading,
    clearStreamChunks,
    setAbortController,
    addStreamChunk,
    loadSessions,
    addRecentInput,
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "running":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">已完成</Badge>;
      case "running":
        return <Badge variant="secondary">进行中</Badge>;
      case "error":
        return <Badge variant="destructive">错误</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  // Extract report from stream chunks
  const report =
    streamChunks.find((c) => c.type === "report")?.content ||
    currentSession?.report;

  // Get current phase
  const currentPhase = streamChunks.filter((c) => c.type === "phase").pop();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">研究模式</h1>
          <p className="text-muted-foreground">基于本地知识库进行深度研究</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="w-4 h-4" />
          <span>知识库文档: {knowledgeFiles.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Input */}
        <div className="space-y-6">
          {/* Research Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="w-5 h-5" />
                新研究
              </CardTitle>
              <CardDescription>输入研究问题开始新的研究</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <RecentInputPopover
                  inputs={recentInputs}
                  isOpen={isInputFocused && recentInputs.length > 0}
                  onClose={() => setIsInputFocused(false)}
                  onSelect={(input) => {
                    setQuestion(input);
                    textareaRef.current?.focus();
                  }}
                />
                <Textarea
                  ref={textareaRef}
                  placeholder="例如: 什么是 LangGraph？它如何用于构建 AI 代理？"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onFocus={() => setIsInputFocused(true)}
                  rows={4}
                  disabled={isLoading}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleStartResearch}
                  disabled={isLoading || !question.trim()}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      研究中...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      开始研究
                    </>
                  )}
                </Button>
                {isLoading && (
                  <Button variant="outline" onClick={abortResearch}>
                    取消
                  </Button>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(true)}
                className="w-full"
              >
                <History className="w-4 h-4 mr-2" />
                查看历史会话 ({sessions.length})
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Stream and Report */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stream Output */}
          {streamChunks.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">研究过程</CardTitle>
                  {currentPhase && (
                    <div className="text-sm font-medium text-primary">
                      {currentPhase.phaseIcon} {currentPhase.phaseName}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto bg-muted p-4 rounded-md">
                  {streamChunks
                    .filter(
                      (c) =>
                        c.type !== "report" &&
                        c.type !== "done" &&
                        c.type !== "phase",
                    )
                    .map((chunk, index) => (
                      <div key={index} className="text-sm">
                        {chunk.type === "thinking" && (
                          <div className="text-muted-foreground">
                            💭 {chunk.content}
                          </div>
                        )}
                        {chunk.type === "tool_call" && (
                          <div className="text-blue-600">
                            🔧 工具调用: {chunk.toolName}
                          </div>
                        )}
                        {chunk.type === "subagent" && (
                          <div className="text-purple-600">
                            🤖 子代理: {chunk.subAgentName || "研究中..."}
                          </div>
                        )}
                        {chunk.type === "todo" && (
                          <div className="text-green-600">
                            ✅ {chunk.content}
                          </div>
                        )}
                        {chunk.type === "error" && (
                          <div className="text-red-600">
                            ❌ 错误: {chunk.error}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Report Output */}
          {report && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">研究报告</CardTitle>
                <CardDescription>基于知识库生成的研究结论</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {report}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!isLoading && streamChunks.length === 0 && !currentSession && (
            <Card className="h-96 flex items-center justify-center">
              <div className="text-center">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">开始新的研究</h3>
                <p className="text-muted-foreground mt-2">
                  在左侧输入研究问题，AI 将基于知识库生成报告
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* History Drawer */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowHistory(false)}
          />
          <div className="relative w-full max-w-md bg-background border-l shadow-xl h-full overflow-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <History className="w-5 h-5" />
                  历史会话
                </h2>
                <p className="text-sm text-muted-foreground">过往的研究任务</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHistory(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-4 space-y-2">
              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  暂无历史会话
                </p>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-3 rounded-md cursor-pointer transition-colors border ${
                      currentSession?.id === session.id
                        ? "bg-primary/10 border-primary/20"
                        : "border-border hover:bg-muted"
                    }`}
                    onClick={() => {
                      loadSession(session.id);
                      setShowHistory(false);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate flex-1">
                        {session.question}
                      </span>
                      {getStatusIcon(session.status)}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(session.createdAt).toLocaleDateString("zh-CN")}
                      </span>
                      {getStatusBadge(session.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
