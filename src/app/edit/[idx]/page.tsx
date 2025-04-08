"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, Plus, Copy, ChevronLeft, ChevronRight, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import Link from "next/link"


type Tag = {
  "time-period": string[]
  "topic-tags": string[]
  "medium-tags": string[]
  "geographical-tags": string[]
}

type Thesis = {
  id: string
  title: string
  author: string
  supervisors: string[]
  year: string
  "alt-title": string
  tags: Tag
  description: string
  pdf_url: string
}

type ThesesData = {
  [key: string]: Omit<Thesis, "id">
}

const defaultThesis: Thesis = {
  id: "",
  title: "",
  author: "",
  supervisors: [""],
  year: "",
  "alt-title": "",
  tags: {
    "time-period": [],
    "topic-tags": [],
    "medium-tags": [],
    "geographical-tags": [],
  },
  description: "",
  pdf_url: "",
}

export default function ThesisMetadataEditor({ params }: { params: Promise<{ idx: string }> }) {
  // Unwrap the params promise using React.use() to get the actual value.
  const { idx: thesisId } = React.use(params)

  const [theses, setTheses] = useState<Thesis[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showCopyAlert, setShowCopyAlert] = useState(false)
  const [editingSupervisor, setEditingSupervisor] = useState<number | null>(null)
  const [editingTag, setEditingTag] = useState<{
    category: string
    index: number
  } | null>(null)
  const [hasLocalChanges, setHasLocalChanges] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try to get data from localStorage first
        const localData = localStorage.getItem("thesesData")
        const localEdits = localStorage.getItem("thesesEdits")

        let thesesArray: Thesis[] = []

        if (localData) {
          const parsedData: ThesesData = JSON.parse(localData)
          thesesArray = Object.entries(parsedData).map(([id, thesis]) => ({
            id,
            ...thesis,
          }))

          // Apply any local edits if they exist
          if (localEdits) {
            const parsedEdits: ThesesData = JSON.parse(localEdits)

            thesesArray = thesesArray.map((thesis) => {
              if (parsedEdits[thesis.id]) {
                return {
                  ...thesis,
                  ...parsedEdits[thesis.id],
                }
              }
              return thesis
            })

            setHasLocalChanges(true)
          }
        } else {
          // If not in localStorage, fetch from the URL
          const response = await fetch("https://huggingface.co/natkite/saapdfs/raw/main/big_json_flat.json")
          const data: ThesesData = await response.json()

          // Convert the object to an array with IDs
          thesesArray = Object.entries(data).map(([id, thesis]) => ({
            id,
            ...thesis,
          }))

          // Store in localStorage for future use
          localStorage.setItem("thesesData", JSON.stringify(data))
        }

        setTheses(thesesArray)

        // Find the index of the thesis with the given ID
        const thesisIndex = thesesArray.findIndex((thesis) => thesis.id === thesisId)
        if (thesisIndex !== -1) {
          setCurrentIndex(thesisIndex)
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching data:", error)
        setLoading(false)
      }
    }

    fetchData()
  }, [thesisId])

  const currentThesis = theses[currentIndex] || defaultThesis

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    setTheses((prev) =>
      prev.map((thesis, index) => (index === currentIndex ? { ...thesis, [name]: value } : thesis)),
    )

    // Save changes to localStorage
    saveChangesToLocalStorage(name, value)
  }

  const saveChangesToLocalStorage = (name: string, value: any) => {
    const localEdits = localStorage.getItem("thesesEdits")
    const edits: ThesesData = localEdits ? JSON.parse(localEdits) : {}

    const thesisId = currentThesis.id

    if (!edits[thesisId]) {
      edits[thesisId] = {
        title: currentThesis.title,
        author: currentThesis.author,
        supervisors: [...currentThesis.supervisors],
        year: currentThesis.year,
        "alt-title": currentThesis["alt-title"],
        tags: JSON.parse(JSON.stringify(currentThesis.tags)),
        description: currentThesis.description,
        pdf_url: currentThesis.pdf_url,
      }
    }

    if (name === "supervisors" || name === "tags") {
      edits[thesisId][name] = value
    } else {
      edits[thesisId][name as keyof Omit<Thesis, "id">] = value
    }

    localStorage.setItem("thesesEdits", JSON.stringify(edits))
    setHasLocalChanges(true)
  }

  const handleSupervisorChange = (index: number, value: string) => {
    if (value.trim() !== "") {
      const newSupervisors = [...currentThesis.supervisors]
      newSupervisors[index] = value

      setTheses((prev) =>
        prev.map((thesis, thesisIndex) =>
          thesisIndex === currentIndex
            ? {
                ...thesis,
                supervisors: newSupervisors,
              }
            : thesis,
        ),
      )

      // Save changes to localStorage
      saveChangesToLocalStorage("supervisors", newSupervisors)
    }
    setEditingSupervisor(null)
  }

  const addSupervisor = () => {
    const newSupervisors = [...currentThesis.supervisors, "New Supervisor"]

    setTheses((prev) =>
      prev.map((thesis, index) =>
        index === currentIndex
          ? {
              ...thesis,
              supervisors: newSupervisors,
            }
          : thesis,
      ),
    )

    // Save changes to localStorage
    saveChangesToLocalStorage("supervisors", newSupervisors)
  }

  const removeSupervisor = (index: number) => {
    const newSupervisors = currentThesis.supervisors.filter((_, i) => i !== index)

    setTheses((prev) =>
      prev.map((thesis, thesisIndex) =>
        thesisIndex === currentIndex
          ? {
              ...thesis,
              supervisors: newSupervisors,
            }
          : thesis,
      ),
    )

    // Save changes to localStorage
    saveChangesToLocalStorage("supervisors", newSupervisors)
  }

  const addTag = (category: string) => {
    const newTags = { ...currentThesis.tags }
    newTags[category as keyof Tag] = [...newTags[category as keyof Tag], "New Tag"]

    setTheses((prev) =>
      prev.map((thesis, index) =>
        index === currentIndex
          ? {
              ...thesis,
              tags: newTags,
            }
          : thesis,
      ),
    )

    // Save changes to localStorage
    saveChangesToLocalStorage("tags", newTags)
  }

  const updateTag = (category: string, index: number, value: string) => {
    if (value.trim() !== "") {
      const newTags = { ...currentThesis.tags }
      const categoryTags = [...newTags[category as keyof Tag]]
      categoryTags[index] = value
      newTags[category as keyof Tag] = categoryTags

      setTheses((prev) =>
        prev.map((thesis, thesisIndex) =>
          thesisIndex === currentIndex
            ? {
                ...thesis,
                tags: newTags,
              }
            : thesis,
        ),
      )

      // Save changes to localStorage
      saveChangesToLocalStorage("tags", newTags)
    }
    setEditingTag(null)
  }

  const removeTag = (category: string, index: number) => {
    const newTags = { ...currentThesis.tags }
    newTags[category as keyof Tag] = newTags[category as keyof Tag].filter((_, i) => i !== index)

    setTheses((prev) =>
      prev.map((thesis, thesisIndex) =>
        thesisIndex === currentIndex
          ? {
              ...thesis,
              tags: newTags,
            }
          : thesis,
      ),
    )

    // Save changes to localStorage
    saveChangesToLocalStorage("tags", newTags)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setShowCopyAlert(true)
        setTimeout(() => setShowCopyAlert(false), 2000)
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err)
      })
  }

  const goToPrevious = () => {
    if (currentIndex > 0) {
      const prevThesis = theses[currentIndex - 1]
      setCurrentIndex(currentIndex - 1)
      router.push(`/edit/${prevThesis.id}`)
    }
  }

  const goToNext = () => {
    if (currentIndex < theses.length - 1) {
      const nextThesis = theses[currentIndex + 1]
      setCurrentIndex(currentIndex + 1)
      router.push(`/edit/${nextThesis.id}`)
    }
  }

  const syncChangesToSource = () => {
    // This is a placeholder for the actual sync functionality
    alert("This would sync changes to the source JSON in a real implementation.")

    // In a real implementation, you would:
    // 1. Get the local edits from localStorage
    // 2. Send them to your backend or API
    // 3. Update the source JSON file
    // 4. Clear the local edits or mark them as synced

    console.log("Changes to sync:", localStorage.getItem("thesesEdits"))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading...</h2>
          <p>Fetching thesis data, please wait.</p>
        </div>
      </div>
    )
  }

  return (
    <><header className="bg-primary text-primary-foreground sticky top-0 z-10">
    <div className="container mx-auto px-4">
      <div className="flex items-center justify-between h-16">
        <div className="flex items-center">
          <BookOpen className="h-8 w-8 mr-2" />
          <span className="text-2xl font-bold">SAAथी</span>
        </div>
        <nav className="hidden md:block">
          <ul className="flex space-x-4">
            <li>
              <Link className="hover:text-primary-foreground/80" href="/">
                Home
              </Link>
            </li>
            <li>
              <Link className="hover:text-primary-foreground/80" href="#">
                Browse
              </Link>
            </li>
            <li>
              <Link className="hover:text-primary-foreground/80" href="#">
                My Theses
              </Link>
            </li>
          </ul>
        </nav>
        
      </div>
    </div>
  </header>
    <div className="flex h-screen absolute ">
       
       
      <PanelGroup direction="horizontal">
        {/* Left Panel: Metadata editor */}
        <Panel defaultSize={50} minSize={20}>
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <Button onClick={goToPrevious} disabled={currentIndex === 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
       
                <span className="text-sm">
                  Thesis {currentIndex + 1} of {theses.length} [{currentThesis.id}]
                </span>
                <Button onClick={goToNext} disabled={currentIndex === theses.length - 1}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <div className="flex">
                  <Input
                    id="title"
                    name="title"
                    value={currentThesis.title}
                    onChange={handleInputChange}
                    className="flex-grow"
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2"
                          onClick={() => copyToClipboard(currentThesis.title)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy title</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <div>
                <Label htmlFor="author">Author</Label>
                <div className="flex">
                  <Input
                    id="author"
                    name="author"
                    value={currentThesis.author}
                    onChange={handleInputChange}
                    className="flex-grow"
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2"
                          onClick={() => copyToClipboard(currentThesis.author)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy author</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Supervisors</Label>
                  <Button variant="ghost" size="icon" onClick={addSupervisor} className="h-8 w-8">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentThesis.supervisors.map((supervisor, index) => (
                    <div
                      key={index}
                      className="flex items-center bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-sm"
                    >
                      {editingSupervisor === index ? (
                        <Input
                          value={supervisor}
                          onChange={(e) => handleSupervisorChange(index, e.target.value)}
                          onBlur={() => handleSupervisorChange(index, supervisor)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSupervisorChange(index, (e.target as HTMLInputElement).value)
                            }
                          }}
                          className="w-24 h-6 p-0 bg-transparent border-none focus:outline-none focus:ring-0"
                          autoFocus
                        />
                      ) : (
                        <span onClick={() => setEditingSupervisor(index)} className="cursor-pointer">
                          {supervisor}
                        </span>
                      )}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 ml-1"
                              onClick={() => copyToClipboard(supervisor)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Copy supervisor</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 ml-1"
                        onClick={() => removeSupervisor(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="year">Year</Label>
                <div className="flex">
                  <Input
                    id="year"
                    name="year"
                    value={currentThesis.year}
                    onChange={handleInputChange}
                    className="flex-grow"
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2"
                          onClick={() => copyToClipboard(currentThesis.year)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy year</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <div>
                <Label htmlFor="alt-title">Alternative Title</Label>
                <div className="flex">
                  <Input
                    id="alt-title"
                    name="alt-title"
                    value={currentThesis["alt-title"]}
                    onChange={handleInputChange}
                    className="flex-grow"
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2"
                          onClick={() => copyToClipboard(currentThesis["alt-title"])}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy alternative title</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <div>
                <Label>Tags</Label>
                {Object.entries(currentThesis.tags).map(([category, tags]) => (
                  <div key={category} className="mt-2">
                    <div className="flex items-center justify-between">
                      <Label>{category}</Label>
                      <Button variant="ghost" size="icon" onClick={() => addTag(category)} className="h-8 w-8">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {tags.map((tag, index) => (
                        <div
                          key={index}
                          className="flex items-center bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-sm"
                        >
                          {editingTag?.category === category && editingTag.index === index ? (
                            <Input
                              value={tag}
                              onChange={(e) => updateTag(category, index, e.target.value)}
                              onBlur={() => updateTag(category, index, tag)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  updateTag(category, index, (e.target as HTMLInputElement).value)
                                }
                              }}
                              className="w-24 h-6 p-0 bg-transparent border-none focus:outline-none focus:ring-0"
                              autoFocus
                            />
                          ) : (
                            <span onClick={() => setEditingTag({ category, index })} className="cursor-pointer">
                              {tag}
                            </span>
                          )}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-4 w-4 ml-1"
                                  onClick={() => copyToClipboard(tag)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copy tag</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 ml-1"
                            onClick={() => removeTag(category, index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <div className="flex">
                  <Textarea
                    id="description"
                    name="description"
                    value={currentThesis.description}
                    onChange={handleInputChange}
                    className="h-32 flex-grow"
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2"
                          onClick={() => copyToClipboard(currentThesis.description)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy description</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <div>
                <Label htmlFor="pdf_url">PDF URL</Label>
                <div className="flex">
                  <Input
                    id="pdf_url"
                    name="pdf_url"
                    value={currentThesis.pdf_url}
                    onChange={handleInputChange}
                    className="flex-grow"
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2"
                          onClick={() => copyToClipboard(currentThesis.pdf_url)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy PDF URL</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              {hasLocalChanges && (
                <div className="mt-6">
                  <Button onClick={syncChangesToSource} className="w-full">
                    Sync Changes to Source
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Changes are currently saved to local storage only
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </Panel>
        <PanelResizeHandle className="w-1 bg-gray-300 cursor-col-resize hover:bg-gray-400 active:bg-gray-500" />

        <Panel defaultSize={50} minSize={20}>
          {currentThesis.pdf_url ? (
            <iframe src={currentThesis.pdf_url} className="w-full h-full" />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100">No PDF available</div>
          )}
        </Panel>
      </PanelGroup>
      {showCopyAlert && (
        <Alert className="fixed bottom-4 right-4 w-auto">
          <AlertDescription>Copied to clipboard!</AlertDescription>
        </Alert>
      )}
    </div></>
  )
}