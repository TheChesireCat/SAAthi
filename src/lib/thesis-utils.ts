export type Tag = {
  "time-period": string[]
  "topic-tags": string[]
  "medium-tags": string[]
  "geographical-tags": string[]
}

export type Thesis = {
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

export type ThesesData = {
  [key: string]: Omit<Thesis, "id">
}

export const defaultThesis: Thesis = {
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

// Function to fetch theses data
export const fetchThesesData = async (): Promise<Thesis[]> => {
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

    return thesesArray
  } catch (error) {
    console.error("Error fetching theses data:", error)
    return []
  }
}

// Function to save changes to localStorage
export const saveChangesToLocalStorage = (thesisId: string, name: string, value: any) => {
  const localEdits = localStorage.getItem("thesesEdits")
  const edits: ThesesData = localEdits ? JSON.parse(localEdits) : {}

  if (!edits[thesisId]) {
    // Get the current thesis data to initialize the edit
    const localData = localStorage.getItem("thesesData")
    if (localData) {
      const parsedData: ThesesData = JSON.parse(localData)
      if (parsedData[thesisId]) {
        edits[thesisId] = { ...parsedData[thesisId] }
      }
    }
  }

  if (name === "supervisors" || name === "tags") {
    edits[thesisId][name] = value
  } else {
    edits[thesisId][name as keyof Omit<Thesis, "id">] = value
  }

  localStorage.setItem("thesesEdits", JSON.stringify(edits))
  return true
}

// Function to sync changes to the source
export const syncChangesToSource = async (): Promise<boolean> => {
  // This is a placeholder for the actual sync functionality
  // In a real implementation, you would:
  // 1. Get the local edits from localStorage
  // 2. Send them to your backend or API
  // 3. Update the source JSON file
  // 4. Clear the local edits or mark them as synced

  const localEdits = localStorage.getItem("thesesEdits")
  if (!localEdits) return false

  try {
    // Simulating an API call
    console.log("Changes to sync:", JSON.parse(localEdits))

    // In a real implementation, you would make an API call here
    // For example:
    // const response = await fetch('/api/sync-theses', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: localEdits,
    // });

    // if (!response.ok) {
    //   throw new Error('Failed to sync changes');
    // }

    // For now, we'll just simulate a successful sync
    // localStorage.removeItem("thesesEdits"); // Uncomment to clear edits after sync

    return true
  } catch (error) {
    console.error("Error syncing changes:", error)
    return false
  }
}
