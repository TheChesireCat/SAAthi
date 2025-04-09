"use client"
import { useEffect, useState } from "react"
import { useRef } from "react"

import Link from "next/link"
import { BugIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
// import Image from "next/image"

// Define the thesis type based on the JSON structure
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
  pdf_url: string,
  img: string
}

type ThesesData = {
  [key: string]: Thesis
}

export default function LibraryPage() {
  const [theses, setTheses] = useState<Thesis[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState("year")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try to get data from localStorage first
        const localData = localStorage.getItem("thesesData")

        if (localData) {
          const parsedData = JSON.parse(localData)
          const thesesArray = Object.entries(parsedData).map(([id, thesis]) => ({
            id,
            ...(thesis as Omit<Thesis, "id">),
          }))
          setTheses(thesesArray)
          setLoading(false)
        } else {
          // If not in localStorage, fetch from the URL
          const response = await fetch("https://huggingface.co/natkite/saapdfs/raw/main/big_json_flat_v2.json")
          const data: ThesesData = await response.json()

          // Convert the object to an array with IDs
          const thesesArray = Object.entries(data).map(([id, thesis]) => ({
            id,
            ...(thesis as Omit<Thesis, "id">),
          }))

          // Store in localStorage for future use
          localStorage.setItem("thesesData", JSON.stringify(data))

          setTheses(thesesArray)
          setLoading(false)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter theses based on search term
  const filteredTheses = theses.filter(
    (thesis) =>
      thesis.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thesis.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thesis.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thesis.tags["topic-tags"].some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Group theses by the selected view (year, topic, etc.)
  const groupThesesByCategory = (category: string) => {
    const grouped: { [key: string]: Thesis[] } = {}

    filteredTheses.forEach((thesis) => {
      let key: string

      if (category === "year") {
        key = thesis.year
      } else if (category === "topic") {
        // Use the first topic tag as the key
        key = thesis.tags["topic-tags"][0] || "Uncategorized"
      } else if (category === "medium") {
        // Use the first medium tag as the key
        key = thesis.tags["medium-tags"][0] || "Uncategorized"
      } else if (category === "geographical") {
        // Use the first geographical tag as the key
        key = thesis.tags["geographical-tags"][0] || "Uncategorized"
      } else {
        key = "Uncategorized"
      }

      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(thesis)
    })

    return grouped
  }

  const groupedTheses = groupThesesByCategory(view)
  const categories = Object.keys(groupedTheses).sort()

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <header className="bg-primary text-primary-foreground sticky top-0 z-10">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                {/* <BookOpen className="h-8 w-8 mr-2" /> */}
                <BugIcon className="h-8 w-8 mr-2" />
                <span className="text-2xl font-bold">SAAथी</span>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Loading...</h2>
              <p className="text-lg">Fetching thesis data, please wait.</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="bg-primary text-primary-foreground sticky top-0 z-10 border-b-3 border-black">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <BugIcon className="h-8 w-8 mr-2" />

              <Link href="/">
                <span className="text-2xl font-bold">SAAथी</span>
              </Link>
            </div>
            <nav className="hidden md:block">
              {/* <ul className="flex space-x-4">
                <li>
                  <Link className="hover:text-primary-foreground/80" href="#">
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
              </ul> */}
            </nav>
            <div className="flex items-center">
              <Input
                type="search"
                placeholder="Search theses..."
                className="mr-2 bg-primary-foreground text-primary w-full md:w-auto"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="secondary">Search</Button>
            </div>
          </div>
        </div>
      </header>
      <div className="bg-secondary border-b-3 border-bg-secondary">
        <div className="container mx-auto px-5 py-2">
          <ToggleGroup type="single" value={view} onValueChange={(value) => value && setView(value)}>
            <ToggleGroupItem className="p-4" value="year">Year</ToggleGroupItem>
            <ToggleGroupItem className="p-4" value="topic">Topics</ToggleGroupItem>
            <ToggleGroupItem className="p-4" value="medium">Medium</ToggleGroupItem>
            <ToggleGroupItem className="p-4" value="geographical">Geography</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      <main className="flex-grow container mx-auto px-4 py-8">
        {categories.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">No Results Found</h2>
              <p className="text-lg">Try adjusting your search criteria.</p>
            </div>
          </div>
        ) : (
          categories.map((category) => (
            <ThesisCarousel key={category} category={category} theses={groupedTheses[category]} />
          ))
        )}
      </main>
      <footer className="bg-primary text-primary-foreground py-4">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} Genuine. No Warranty. Horn OK Please.</p>
        </div>
      </footer>
    </div>
  )
}

function ThesisCarousel({ category, theses }: { category: string; theses: Thesis[] }) {
  const carouselRef = useRef<HTMLDivElement>(null)
  // const [scrollPosition, setScrollPosition] = useState(0)

  // useEffect(() => {
  //   const handleScroll = () => {
  //     if (carouselRef.current) {
  //       setScrollPosition(carouselRef.current.scrollLeft)
  //     }
  //   }

  //   const current = carouselRef.current
  //   if (current) {
  //     current.addEventListener("scroll", handleScroll)
  //     return () => current.removeEventListener("scroll", handleScroll)
  //   }
  // }, [])

  const scroll = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const { clientWidth } = carouselRef.current
      const scrollAmount = direction === "left" ? -clientWidth : clientWidth
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }
  }

  return (
    <div className="w-full mb-8">
      <h2 className="text-2xl font-bold mb-4">{category}</h2>
      <div className="relative">
        <div
          ref={carouselRef}
          className="flex overflow-x-scroll scrollbar-hide space-x-4 p-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {theses.map((thesis) => (
            <Link href={`/edit/${thesis.id}`} key={thesis.id}>
              <Card className="flex-shrink-0 w-64 group cursor-pointer border-3 border-black bg-white transition-all duration-200">
                <CardContent className="p-0 relative">
                  <div className="w-full h-40 bg-white border-b-3 border-black flex items-center justify-center">
                    <img
                      src={`https://huggingface.co/natkite/saapdfs/resolve/main/imgs/${thesis.img}`}
                      alt="Card Image"
                      width={512}
                      height={512}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="p-4 bg-white">
                    <h3 className="font-bold text-sm uppercase tracking-wider truncate">{thesis.title}</h3>
                    <p className="text-xs text-black truncate">{thesis.author}</p>
                    <p className="text-xs text-black">{thesis.year}</p>
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-90 text-white p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 overflow-y-auto">
                    <h3 className="font-bold text-sm uppercase mb-2">{thesis.title}</h3>
                    <p className="text-xs mb-1">Author: {thesis.author}</p>
                    <p className="text-xs mb-1">Year: {thesis.year}</p>
                    <p className="text-xs mb-1">Supervisor: {thesis.supervisors.join(", ")}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        {theses.length > 3 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-background/50 text-foreground rounded-full p-2 hover:bg-background/75"
              onClick={() => scroll("left")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-background/50 text-foreground rounded-full p-2 hover:bg-background/75"
              onClick={() => scroll("right")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
