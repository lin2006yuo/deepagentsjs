import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Folder,
  File,
  ChevronRight,
  ChevronLeft,
  Upload,
  Trash2,
  Plus,
  Save,
  X,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useFilesystemStore } from '@/stores'
import {
  fetchFileList,
  fetchFileContent,
  writeFile,
  deleteFile,
  createDirectory,
} from '@/services/api'
import type { FileInfo } from '@deepagents/shared'
import { formatFileSize, formatTimestamp } from '@deepagents/shared'

export function FilesystemPage() {
  const [newFileName, setNewFileName] = useState('')
  const [newDirName, setNewDirName] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [showNewFileDialog, setShowNewFileDialog] = useState(false)
  const [showNewDirDialog, setShowNewDirDialog] = useState(false)

  const {
    currentPath,
    files,
    selectedFile,
    fileContent,
    isLoading,
    setCurrentPath,
    setFiles,
    setSelectedFile,
    setFileContent,
    setIsLoading,
    navigateToParent,
  } = useFilesystemStore()

  const loadFiles = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchFileList(currentPath)
      setFiles(data.files)
    } catch (error) {
      toast.error('加载文件列表失败')
    } finally {
      setIsLoading(false)
    }
  }, [currentPath, setFiles, setIsLoading])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  const handleFileClick = async (file: FileInfo) => {
    if (file.isDirectory) {
      setCurrentPath(file.path)
      setSelectedFile(null)
      setFileContent('')
    } else {
      setSelectedFile(file)
      setIsLoading(true)
      try {
        const content = await fetchFileContent(file.path)
        setFileContent(content.content)
        setIsEditing(false)
      } catch (error) {
        toast.error('加载文件内容失败')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleSaveFile = async () => {
    if (!selectedFile) return

    try {
      await writeFile(selectedFile.path, fileContent)
      toast.success('文件保存成功')
      setIsEditing(false)
      loadFiles()
    } catch (error) {
      toast.error('保存文件失败')
    }
  }

  const handleDeleteFile = async (file: FileInfo) => {
    if (!confirm(`确定要删除 ${file.name} 吗？`)) return

    try {
      await deleteFile(file.path)
      toast.success('删除成功')
      if (selectedFile?.path === file.path) {
        setSelectedFile(null)
        setFileContent('')
      }
      loadFiles()
    } catch (error) {
      toast.error('删除失败')
    }
  }

  const handleCreateFile = async () => {
    if (!newFileName.trim()) return

    const filePath = currentPath === '.' ? newFileName : `${currentPath}/${newFileName}`
    try {
      await writeFile(filePath, '')
      toast.success('文件创建成功')
      setNewFileName('')
      setShowNewFileDialog(false)
      loadFiles()
    } catch (error) {
      toast.error('创建文件失败')
    }
  }

  const handleCreateDirectory = async () => {
    if (!newDirName.trim()) return

    const dirPath = currentPath === '.' ? newDirName : `${currentPath}/${newDirName}`
    try {
      await createDirectory(dirPath)
      toast.success('目录创建成功')
      setNewDirName('')
      setShowNewDirDialog(false)
      loadFiles()
    } catch (error) {
      toast.error('创建目录失败')
    }
  }

  const getFileIcon = (file: FileInfo) => {
    if (file.isDirectory) {
      return <Folder className="w-5 h-5 text-blue-500" />
    }
    return <File className="w-5 h-5 text-gray-500" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">文件系统</h1>
          <p className="text-muted-foreground">管理工作区文件</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadFiles}>
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
          <Dialog open={showNewDirDialog} onOpenChange={setShowNewDirDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                新建目录
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新建目录</DialogTitle>
                <DialogDescription>输入目录名称</DialogDescription>
              </DialogHeader>
              <Input
                value={newDirName}
                onChange={(e) => setNewDirName(e.target.value)}
                placeholder="目录名称"
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewDirDialog(false)}>
                  取消
                </Button>
                <Button onClick={handleCreateDirectory}>创建</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={showNewFileDialog} onOpenChange={setShowNewFileDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                新建文件
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新建文件</DialogTitle>
                <DialogDescription>输入文件名称</DialogDescription>
              </DialogHeader>
              <Input
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="文件名"
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewFileDialog(false)}>
                  取消
                </Button>
                <Button onClick={handleCreateFile}>创建</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File List */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              {currentPath !== '.' && (
                <Button variant="ghost" size="sm" onClick={navigateToParent}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              )}
              <CardTitle className="text-lg">文件列表</CardTitle>
            </div>
            <CardDescription>当前路径: {currentPath}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {isLoading && files.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">加载中...</p>
              ) : files.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">空目录</p>
              ) : (
                files.map((file) => (
                  <div
                    key={file.path}
                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                      selectedFile?.path === file.path
                        ? 'bg-primary/10'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => handleFileClick(file)}
                  >
                    <div className="flex items-center gap-3">
                      {getFileIcon(file)}
                      <span className="text-sm font-medium">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground">
                        {file.isDirectory ? '--' : formatFileSize(file.size)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(file.modifiedAt)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteFile(file)
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* File Editor */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {selectedFile ? selectedFile.name : '文件编辑器'}
                </CardTitle>
                <CardDescription>
                  {selectedFile
                    ? selectedFile.isDirectory
                      ? '目录'
                      : `${formatFileSize(selectedFile.size)}`
                    : '选择文件进行编辑'}
                </CardDescription>
              </div>
              {selectedFile && !selectedFile.isDirectory && (
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                        <X className="w-4 h-4 mr-2" />
                        取消
                      </Button>
                      <Button size="sm" onClick={handleSaveFile}>
                        <Save className="w-4 h-4 mr-2" />
                        保存
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={() => setIsEditing(true)}>
                      编辑
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedFile ? (
              selectedFile.isDirectory ? (
                <div className="text-center text-muted-foreground py-8">
                  <Folder className="w-12 h-12 mx-auto mb-4" />
                  <p>这是一个目录</p>
                  <p className="text-sm">点击以浏览内容</p>
                </div>
              ) : (
                <Textarea
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  disabled={!isEditing}
                  className="font-mono text-sm min-h-[400px]"
                  placeholder="文件内容..."
                />
              )
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <File className="w-12 h-12 mx-auto mb-4" />
                <p>选择一个文件进行查看或编辑</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
