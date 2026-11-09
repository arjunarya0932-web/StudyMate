
import { useState, useEffect } from 'react'
import studyBuddy from './assets/study-buddy.png'
import './App.css'
import knowledgeBase from './data/knowledgeBase'
import ReactMarkdown from 'react-markdown'

// API Base URL - configured via environment variable for production
// Defaults to localhost for development, uses VITE_API_BASE_URL in production builds
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const menu = [
  { name: 'Home', icon: '⌂' },
  { name: 'AI Chat', icon: '✧' },
  { name: 'PDF Assistant', icon: '▤' },
  { name: 'Notes Generator', icon: '▧' },
  { name: 'Notice Generator', icon: '▤' },
  { name: 'Quiz & Exams', icon: '◎' },
  { name: 'Study Library', icon: '▣' },
  { name: 'My Notes', icon: '▤' },
  { name: 'Progress', icon: '↗' },
  { name: 'Settings', icon: '⚙' },
]

const tools = [
  {
    name: 'AI Chat',
    icon: '✧',
    color: 'purple',
    description: 'Get instant answers from your AI study assistant.',
  },
  {
    name: 'PDF Assistant',
    icon: '▤',
    color: 'lime',
    description: 'Upload PDFs and explore summaries and insights.',
  },
  {
    name: 'Notes Generator',
    icon: '▧',
    color: 'red',
    description: 'Turn topics into organized study notes.',
  },
  {
    name: 'Notice Generator',
    icon: '▤',
    color: 'cyan',
    description: 'Create professional college notices with AI.',
},
  {
    name: 'Quiz & Exams',
    icon: '◎',
    color: 'cyan',
    description: 'Practice MCQs and test your knowledge.',
  },
]

function findAnswer(userQuestion, knowledgeBase) {
  const normalize = (text) =>
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

  const question = normalize(userQuestion)
  const paddedQuestion = ` ${question} `

  let bestMatch = null
  let bestScore = 0

  knowledgeBase.forEach((item) => {
    const keywords = [item.question, ...item.keywords]

    keywords.forEach((keyword) => {
      const normalizedKeyword = normalize(keyword)
      const paddedKeyword = ` ${normalizedKeyword} `

      if (
        paddedQuestion.includes(paddedKeyword) &&
        normalizedKeyword.length > bestScore
      ) {
        bestMatch = item
        bestScore = normalizedKeyword.length
      }
    })
  })

  return bestMatch ? bestMatch.answer : null
}

function App() {
  const [showBuddy, setShowBuddy] = useState(true)
  const [buddyMessage, setBuddyMessage] = useState('')

  const [token, setToken] = useState(
    () => localStorage.getItem('studymate_token') || ''
  )
  const [quizHistory, setQuizHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('studymate_user')) || null
    } catch {
      return null
    }
  })

  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState('')
  const [authMode, setAuthMode] = useState('signup')

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  })

  const [activePage, setActivePage] = useState('Home')
  const [prompt, setPrompt] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [conversations, setConversations] = useState([])
  const [activeConversationId, setActiveConversationId] = useState(null)
  const [notes, setNotes] = useState([])
  const [selectedStudySubject, setSelectedStudySubject] = useState(null)
  const [selectedStudyChapter, setSelectedStudyChapter] = useState(null)
  const [quizAnswers, setQuizAnswers] = useState({});
  const [submittedChapters, setSubmittedChapters] = useState({})
  const [newNote, setNewNote] = useState('')
  const [noteTopic, setNoteTopic] = useState('')
  const [generatedNotes, setGeneratedNotes] = useState('')
  const [noteLoading, setNoteLoading] = useState(false)
  const [noteError, setNoteError] = useState('')
  // My Notes editing state
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [editingNoteContent, setEditingNoteContent] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)

  // Settings preferences
  const [theme, setTheme] = useState(() => localStorage.getItem('studymate_theme') || 'dark')
  const [notifications, setNotifications] = useState(() => localStorage.getItem('studymate_notifications') === 'true')
  const [saveStatus, setSaveStatus] = useState('')

  useEffect(() => {
    document.body.className = theme
  }, [theme])

  const saveSettings = () => {
    localStorage.setItem('studymate_theme', theme)
    localStorage.setItem('studymate_notifications', notifications)
    setSaveStatus('Changes saved!')
    setTimeout(() => setSaveStatus(''), 2000)
  }

useEffect(() => {
  const fetchQuizHistory = async () => {
    if (!token) {
      setQuizHistory([])
      return
    }

    setHistoryLoading(true)
    setHistoryError('')

    try {
      const response = await fetch(`${API_BASE}/api/quiz-attempts/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Could not load quiz history.')
      }

      const data = await response.json()
      setQuizHistory(data)
    } catch (error) {
      setHistoryError(error.message)
    } finally {
      setHistoryLoading(false)
    }
  }

  fetchQuizHistory()
}, [token])

  // PDF Assistant states
const [pdfFile, setPdfFile] = useState(null)
const [pdfSummary, setPdfSummary] = useState('')
const [pdfTopics, setPdfTopics] = useState('')
const [pdfQuestions, setPdfQuestions] = useState('')
const [pdfQuestion, setPdfQuestion] = useState('')
const [pdfAnswer, setPdfAnswer] = useState('')
const [pdfLoading, setPdfLoading] = useState(false)
const [pdfError, setPdfError] = useState('')
const [pdfPageCount, setPdfPageCount] = useState(null)

// Quiz Generator states
const [quizTopic, setQuizTopic] = useState('')
const [quizCount, setQuizCount] = useState(5)
const [quizLoading, setQuizLoading] = useState(false)
const [quizError, setQuizError] = useState('')
const [currentQuiz, setCurrentQuiz] = useState(null)
const [selectedAnswers, setSelectedAnswers] = useState({})
const [quizSubmitted, setQuizSubmitted] = useState(false)
const [savedQuizzes, setSavedQuizzes] = useState([])

// Notice Generator states
const [noticeTopic, setNoticeTopic] = useState('')
const [noticeDetails, setNoticeDetails] = useState('')
const [generatedNotice, setGeneratedNotice] = useState('')
const [noticeLoading, setNoticeLoading] = useState(false)
const [noticeError, setNoticeError] = useState('')
const [savedNotices, setSavedNotices] = useState([])

// PDF Assistant states - History
const [savedPdfs, setSavedPdfs] = useState([])

// Home page dynamic data
const [homeNotesCount, setHomeNotesCount] = useState(0)
const [homeQuizAttempts, setHomeQuizAttempts] = useState([])
const [homeChatCount, setHomeChatCount] = useState(0)
const [homePdfCount, setHomePdfCount] = useState(0)

  // Hamster message automatically disappears
  useEffect(() => {
    if (!buddyMessage) return

    const timer = setTimeout(() => {
      setBuddyMessage('')
    }, 2000)

    return () => clearTimeout(timer)
  }, [buddyMessage])

  // Load chat history after login
  useEffect(() => {
    if (!token) {
      setConversations([])
      setChatMessages([])
      setActiveConversationId(null)
      return
    }

    const loadInitialChats = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/api/chat/conversations`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        if (!response.ok) {
          throw new Error('Could not load chat history.')
        }

        const data = await response.json()
        const chatList = data.conversations || []

        setConversations(chatList)

        if (chatList.length > 0) {
          const latestChat = chatList[0]
          setActiveConversationId(latestChat.conversation_id)

          const historyResponse = await fetch(
            `${API_BASE}/api/chat/history?conversation_id=${encodeURIComponent(
              latestChat.conversation_id
            )}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          )

          if (!historyResponse.ok) {
            throw new Error('Could not load conversation messages.')
          }

          const historyData = await historyResponse.json()

          setChatMessages(
            (historyData.messages || []).map((message) => ({
              role: message.role,
              text: message.content,
            }))
          )
        } else {
          setActiveConversationId(null)
          setChatMessages([])
        }
      } catch (error) {
        setChatError(error.message)
      }
    }

    loadInitialChats()
  }, [token])

  // Load saved notes after login
useEffect(() => {
  if (!token) {
    setNotes([])
    return
  }

  const loadMyNotes = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/notes/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Could not load saved notes.')
      }

      const data = await response.json()
      setNotes(data.notes || [])
    } catch (error) {
      console.error('Notes loading error:', error)
    }
  }

  loadMyNotes()
}, [token])

  // Load saved notices after login
  useEffect(() => {
    if (!token) {
      setSavedNotices([])
      setSavedPdfs([])
      return
    }

    const loadSavedNotices = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/notices/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Could not load saved notices.')
        }

        const data = await response.json()
        setSavedNotices(data.notices || [])
      } catch (error) {
        console.error('Notices loading error:', error)
      }
    }

    loadSavedNotices()
  }, [token])

  // Load saved PDF history
  useEffect(() => {
    if (!token) {
      setSavedPdfs([])
      return
    }

    const loadSavedPdfs = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/pdf/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Could not load saved PDFs.')
        }

        const data = await response.json()
        setSavedPdfs(data.documents || [])
      } catch (error) {
        console.error('PDF history loading error:', error)
      }
    }

    loadSavedPdfs()
  }, [token])

  // Load home page analytics after login
  useEffect(() => {
    if (!token) {
      setHomeNotesCount(0)
      setHomeQuizAttempts([])
      setHomeChatCount(0)
      setHomePdfCount(0)
      return
    }

    const loadHomeAnalytics = async () => {
      try {
        // Load notes count
        const notesResp = await fetch(`${API_BASE}/api/notes/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (notesResp.ok) {
          const notesData = await notesResp.json()
          setHomeNotesCount(notesData.notes?.length || 0)
        }

        // Load quiz attempts (limit to last 3 for dashboard)
        const quizResp = await fetch(`${API_BASE}/api/quiz-attempts/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (quizResp.ok) {
          const quizData = await quizResp.json()
          const allAttempts = quizData
          setHomeQuizAttempts(allAttempts.slice(-3).reverse())
        }

        // Load chat count
        const chatResp = await fetch(`${API_BASE}/api/chat/conversations`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (chatResp.ok) {
          const chatData = await chatResp.json()
          setHomeChatCount(chatData.conversations?.length || 0)
        }

        // Load PDF count
        const pdfResp = await fetch(`${API_BASE}/api/pdf/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (pdfResp.ok) {
          const pdfData = await pdfResp.json()
          setHomePdfCount(pdfData.documents?.length || 0)
        }

      } catch (error) {
        console.error('Home analytics loading error:', error)
      }
    }

    loadHomeAnalytics()
  }, [token])

  // Login and signup
  async function handleAuth(event) {
    event.preventDefault()
    setAuthError('')

    if (!form.email.trim() || !form.password.trim()) {
      setAuthError('Please enter your email and password.')
      return
    }

    if (authMode === 'signup' && !form.name.trim()) {
      setAuthError('Please enter your name.')
      return
    }

    if (form.password.length < 8) {
      setAuthError('Password must be at least 8 characters.')
      return
    }

    setAuthLoading(true)

    try {
      if (authMode === 'signup') {
        const signupResponse = await fetch(
          `${API_BASE}/api/users/signup`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: form.name.trim(),
              email: form.email.trim(),
              password: form.password,
            }),
          }
        )

        const signupData = await signupResponse.json()

        if (!signupResponse.ok) {
          throw new Error(
            signupData.detail || 'Account creation failed.'
          )
        }
      }

      const loginResponse = await fetch(
        `${API_BASE}/api/users/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: form.email.trim(),
            password: form.password,
          }),
        }
      )

      const loginData = await loginResponse.json()

      if (!loginResponse.ok) {
        throw new Error(loginData.detail || 'Login failed.')
      }

      localStorage.setItem('studymate_token', loginData.access_token)
      localStorage.setItem(
        'studymate_user',
        JSON.stringify(loginData.user)
      )

      setChatMessages([])
      setToken(loginData.access_token)
      setCurrentUser(loginData.user)
      setActivePage('Home')
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  // Logout
  const logout = () => {
    localStorage.removeItem('studymate_token')
    localStorage.removeItem('studymate_user')

    setToken('')
    setCurrentUser(null)
    setChatMessages([])
    setChatError('')
    setConversations([])
    setActiveConversationId(null)

    setForm({
      name: '',
      email: '',
      password: '',
    })

    // Reset notes state
    setNotes([])
    setNewNote('')
    setEditingNoteId(null)
    setEditingNoteContent('')
    setNoteError('')
    setNoteSaving(false)

    setAuthMode('login')
    setActivePage('Home')
  }

  // Save a note to the backend API
  const saveNoteToBackend = async (noteData) => {
    if (!token) return

    setNoteSaving(true)
    setNoteError('')

    try {
      const response = await fetch(`${API_BASE}/api/notes/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(noteData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Could not save note.')
      }

      // Reload notes from server
      await reloadNotes()
      return true
    } catch (error) {
      setNoteError(error.message)
      return false
    } finally {
      setNoteSaving(false)
    }
  }

  // Update an existing note on the backend
  const updateNoteOnBackend = async (noteId, noteData) => {
    if (!token) return

    setNoteSaving(true)
    setNoteError('')

    try {
      const response = await fetch(`${API_BASE}/api/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(noteData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Could not update note.')
      }

      // Reload notes from server
      await reloadNotes()
      return true
    } catch (error) {
      setNoteError(error.message)
      return false
    } finally {
      setNoteSaving(false)
    }
  }

  // Reload notes from server
  const reloadNotes = async () => {
    if (!token) return

    try {
      const response = await fetch(`${API_BASE}/api/notes/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Could not load saved notes.')
      }

      const data = await response.json()
      setNotes(data.notes || [])
    } catch (error) {
      console.error('Notes reload error:', error)
    }
  }

  // Refresh the conversation list
  const loadConversations = async () => {
    if (!token) return

    try {
      const response = await fetch(
        `${API_BASE}/api/chat/conversations`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (!response.ok) {
        throw new Error('Could not refresh conversations.')
      }

      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (error) {
      setChatError(error.message)
    }
  }

  // Send a message in AI Chat
  const handleSendMessage = async (event) => {
    event.preventDefault()

    if (!prompt.trim() || chatLoading) return

    if (!token) {
      setChatError('Please login again to use AI Chat.')
      return
    }

    const userQuestion = prompt.trim()

    setPrompt('')
    setChatError('')
    setChatLoading(true)

    setChatMessages((previous) => [
      ...previous,
      {
        role: 'user',
        text: userQuestion,
      },
    ])

    try {
      const conversationParam =
        activeConversationId && activeConversationId !== 'legacy'
          ? `&conversation_id=${encodeURIComponent(activeConversationId)}`
          : ''

      const response = await fetch(
        `${API_BASE}/api/chat/message?message=${encodeURIComponent(
          userQuestion
        )}${conversationParam}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || 'Unable to get an AI response.'
        )
      }

      setActiveConversationId(data.conversation_id)

      setChatMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          text: data.assistant_message.content,
        },
      ])

      await loadConversations()
    } catch (error) {
      setChatError(error.message)
    } finally {
      setChatLoading(false)
    }
  }

  // Start a fresh conversation
  const startNewChat = () => {
    setActiveConversationId(null)
    setChatMessages([])
    setPrompt('')
    setChatError('')
  }

  // Open an existing conversation
  const openConversation = async (conversationId) => {
    if (!token) return

    setChatError('')
    setActiveConversationId(conversationId)
    setChatMessages([])

    try {
      const response = await fetch(
        `${API_BASE}/api/chat/history?conversation_id=${encodeURIComponent(
          conversationId
        )}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (!response.ok) {
        throw new Error('Could not open this conversation.')
      }

      const data = await response.json()

      setChatMessages(
        (data.messages || []).map((message) => ({
          role: message.role,
          text: message.content,
        }))
      )
    } catch (error) {
      setChatError(error.message)
    }
  }

  // Delete a conversation
  const deleteConversation = async (conversationId) => {
    if (!token) return

    const confirmed = window.confirm(
      'Delete this conversation permanently?'
    )

    if (!confirmed) return

    try {
      const response = await fetch(
        `${API_BASE}/api/chat/conversations/${encodeURIComponent(
          conversationId
        )}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(
          data.detail || 'Could not delete conversation.'
        )
      }

      const remaining = conversations.filter(
        (chat) => chat.conversation_id !== conversationId
      )

      setConversations(remaining)

      if (activeConversationId === conversationId) {
        if (remaining.length > 0) {
          await openConversation(remaining[0].conversation_id)
        } else {
          startNewChat()
        }
      }
    } catch (error) {
      setChatError(error.message)
    }
  }

  // Open a selected tool
  const openTool = (toolName) => {
    setActivePage(toolName)
  }

  // Clear PDF results
  const clearPdfResults = () => {
    setPdfSummary('')
    setPdfTopics('')
    setPdfQuestions('')
    setPdfAnswer('')
    setPdfQuestion('')
    setPdfError('')
    setPdfPageCount(null)
  }
 
// Generate a new quiz
const handleGenerateQuiz = async (event) => {
  event.preventDefault()

  if (!quizTopic.trim()) {
    setQuizError('Please enter a topic.')
    return
  }

  if (!token) {
    setQuizError('Please login again.')
    return
  }

  setQuizLoading(true)
  setQuizError('')
  setCurrentQuiz(null)
  setSelectedAnswers({})
  setQuizSubmitted(false)

  try {
    const response = await fetch(`${API_BASE}/api/quizzes/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        topic: quizTopic.trim(),
        question_count: Number(quizCount),
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.detail || 'Could not generate quiz.')
    }

    setCurrentQuiz(data.quiz)
    await loadSavedQuizzes()
  } catch (error) {
    setQuizError(error.message)
  } finally {
    setQuizLoading(false)
  }
}

// Generate Notice
const handleGenerateNotice = async () => {
  if (!noticeTopic.trim() || !noticeDetails.trim()) {
    setNoticeError('Please enter the notice topic and details.')
    return
  }

  setNoticeLoading(true)
  setNoticeError('')
  setGeneratedNotice('')

  try {
    const response = await fetch(`${API_BASE}/api/notices/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        topic: noticeTopic,
        details: noticeDetails,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.detail || 'Could not generate notice.')
    }

    setGeneratedNotice(data.notice.content)
    // Reload from server to stay in sync and avoid duplicates
    await loadSavedNotices()
  } catch (error) {
    setNoticeError(error.message)
  } finally {
    setNoticeLoading(false)
  }
}

// Delete a saved PDF
const handleDeletePdf = async (pdfId) => {
  if (!token) return

  const confirmed = window.confirm(
    'Delete this PDF permanently?'
  )

  if (!confirmed) return

  try {
    const response = await fetch(
      `${API_BASE}/api/pdf/${pdfId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.detail || 'Could not delete PDF.')
    }

    setSavedPdfs((prev) => prev.filter((pdf) => pdf.id !== pdfId))

    // Clear current PDF if it was the deleted one
    if (pdfFile && pdfFile.name === data.filename) {
      clearPdfResults()
    }
  } catch (error) {
    console.error('Error deleting PDF:', error.message)
  }
}
// Generate Study Notes
const handleGenerateNotes = async () => {
  if (!noteTopic.trim()) {
    setNoteError('Please enter a topic.')
    return
  }

  setNoteLoading(true)
  setNoteError('')
  setGeneratedNotes('')

  try {
    const response = await fetch(`${API_BASE}/api/notes/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        topic: noteTopic,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.detail || 'Could not generate notes.')
    }

    setGeneratedNotes(data.note.content)
    setNotes((previous) => [data.note, ...previous])
    setNoteTopic('')
  } catch (error) {
    setNoteError(error.message)
  } finally {
    setNoteLoading(false)
  }
}
// Load saved quizzes
const loadSavedQuizzes = async () => {
  if (!token) return

  try {
    const response = await fetch(`${API_BASE}/api/quizzes/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.detail || 'Could not load saved quizzes.')
    }

    setSavedQuizzes(data.quizzes || [])
  } catch (error) {
    setQuizError(error.message)
  }
}

// Load saved notices
const loadSavedNotices = async () => {
  if (!token) return

  try {
    const response = await fetch(`${API_BASE}/api/notices/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.detail || 'Could not load saved notices.')
    }

    setSavedNotices(data.notices || [])
  } catch (error) {
    console.error('Notices loading error:', error)
  }
}

// Select an answer
const selectQuizAnswer = (questionIndex, answer) => {
  if (quizSubmitted) return

  setSelectedAnswers((previous) => ({
    ...previous,
    [questionIndex]: answer,
  }))
}

// Submit quiz and save score to database
const submitQuiz = async () => {
  if (!currentQuiz) return

  if (
    Object.keys(selectedAnswers).length !==
    currentQuiz.questions.length
  ) {
    setQuizError('Please answer all questions before submitting.')
    return
  }

  setQuizError('')
  setQuizSubmitted(true)

  if (!token) return

  // Calculate score directly (quizScore is a computed const, not state)
  const calculatedScore = currentQuiz.questions.filter(
    (question, index) =>
      selectedAnswers[index] === question.correct_answer
  ).length

  try {
    const response = await fetch(`${API_BASE}/api/quiz-attempts/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        subject: currentQuiz.topic || currentQuiz.title || 'General',
        chapter: 'AI Generated Quiz',
        score: calculatedScore,
        total_questions: currentQuiz.questions.length,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Failed to save quiz attempt:', errorData.detail)
      return
    }

    // Refresh quiz history so Progress page updates immediately
    const historyResponse = await fetch(`${API_BASE}/api/quiz-attempts/`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (historyResponse.ok) {
      const historyData = await historyResponse.json()
      setQuizHistory(historyData)
    }
  } catch (error) {
    console.error('Error saving quiz attempt:', error.message)
  }
}

// Delete saved quiz
const deleteSavedQuiz = async (quizId) => {
  if (!token) return

  try {
    const response = await fetch(
      `${API_BASE}/api/quizzes/${quizId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.detail || 'Could not delete quiz.')
    }

    setSavedQuizzes((previous) =>
      previous.filter((quiz) => quiz.id !== quizId)
    )

    if (currentQuiz?.id === quizId) {
      setCurrentQuiz(null)
      setSelectedAnswers({})
      setQuizSubmitted(false)
    }
  } catch (error) {
    setQuizError(error.message)
  }
}

// Calculate quiz score
const quizScore = currentQuiz
  ? currentQuiz.questions.filter(
      (question, index) =>
        selectedAnswers[index] === question.correct_answer
    ).length
  : 0
  // Upload PDF and generate AI summary, topics and questions
  const handlePdfUpload = async (event) => {
    event.preventDefault()

    if (!pdfFile) {
      setPdfError('Please select a PDF file first.')
      return
    }

    if (!token) {
      setPdfError('Please login again to use PDF Assistant.')
      return
    }

    setPdfLoading(true)
    clearPdfResults()

    try {
      const formData = new FormData()
      formData.append('file', pdfFile)

      const response = await fetch(`${API_BASE}/api/pdf/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Could not process this PDF.')
      }

      setPdfSummary(data.summary || '')
      setPdfTopics(data.topics || '')
      setPdfQuestions(data.questions || '')
      setPdfPageCount(data.page_count ?? null)
    } catch (error) {
      setPdfError(error.message)
    } finally {
      setPdfLoading(false)
    }
  }

  // Ask a question about the selected PDF
  const handlePdfQuestion = async (event) => {
    event.preventDefault()

    if (!pdfFile || !pdfQuestion.trim() || pdfLoading) return

    if (!token) {
      setPdfError('Please login again to use PDF Assistant.')
      return
    }

    setPdfLoading(true)
    setPdfError('')
    setPdfAnswer('')

    try {
      const formData = new FormData()
      formData.append('file', pdfFile)
      formData.append('question', pdfQuestion.trim())

      const response = await fetch(`${API_BASE}/api/pdf/ask`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || 'Could not answer your question.'
        )
      }

      setPdfAnswer(data.answer || '')
      setPdfQuestion('')
    } catch (error) {
      setPdfError(error.message)
    } finally {
      setPdfLoading(false)
    }
  }

  // Download PDF study report
  const downloadPdfSummary = () => {
    if (!pdfSummary) return

    const content = [
      'STUDYMATE - PDF STUDY REPORT',
      `File: ${pdfFile?.name || 'Uploaded PDF'}`,
      `Pages: ${pdfPageCount ?? 'Unknown'}`,
      '',
      'AI SUMMARY',
      '------------------------------',
      pdfSummary,
      '',
      'IMPORTANT TOPICS',
      '------------------------------',
      pdfTopics || 'Not available',
      '',
      'IMPORTANT QUESTIONS',
      '------------------------------',
      pdfQuestions || 'Not available',
    ].join('\n')

    const blob = new Blob([content], {
      type: 'text/plain;charset=utf-8',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'StudyMate-PDF-Study-Report.txt'

    document.body.appendChild(link)
    link.click()
    link.remove()

    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  // Login screen
  if (!currentUser) {
    return (
      <div className="auth-screen">
        <div className="auth-brand">
          <span>✿</span> Study<span className="brand-lime">Mate</span>
        </div>

        <div className="auth-card">
          <div className="auth-heading">
            <span className="large-symbol">✧</span>

            <p className="eyebrow">YOUR PERSONAL AI STUDY SPACE</p>

            <h1>
              {authMode === 'signup' ? 'Create your' : 'Welcome'}
              <br />
              <span>
                {authMode === 'signup' ? 'Account.' : 'Back.'}
              </span>
            </h1>

            <p>
              {authMode === 'signup'
                ? 'Start your smarter learning journey with StudyMate.'
                : 'Continue your learning journey with StudyMate.'}
            </p>
          </div>

          <div className="auth-tabs">
            <button
              className={
                authMode === 'login' ? 'auth-tab active' : 'auth-tab'
              }
              onClick={() => {
                setAuthMode('login')
                setAuthError('')
              }}
            >
              Login
            </button>

            <button
              className={
                authMode === 'signup' ? 'auth-tab active' : 'auth-tab'
              }
              onClick={() => {
                setAuthMode('signup')
                setAuthError('')
              }}
            >
              Sign Up
            </button>
          </div>

          <form className="auth-form" onSubmit={handleAuth}>
            {authMode === 'signup' && (
              <label>
                Full Name

                <input
                  type="text"
                  placeholder="Enter your name"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  autoComplete="name"
                />
              </label>
            )}

            <label>
              Email Address

              <input
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                autoComplete="email"
              />
            </label>

            <label>
              Password

              <input
                type="password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                autoComplete={
                  authMode === 'signup'
                    ? 'new-password'
                    : 'current-password'
                }
              />
            </label>

            {authError && (
              <p className="auth-error">{authError}</p>
            )}

            <button
              className="auth-submit"
              type="submit"
              disabled={authLoading}
            >
              {authLoading
                ? 'Please wait...'
                : authMode === 'signup'
                  ? 'Create Account →'
                  : 'Login →'}
            </button>
          </form>

          <p className="auth-switch">
            {authMode === 'signup'
              ? 'Already have an account?'
              : "Don't have an account?"}

            <button
              onClick={() => {
                setAuthMode(
                  authMode === 'signup' ? 'login' : 'signup'
                )
                setAuthError('')
              }}
            >
              {authMode === 'signup' ? 'Login' : 'Sign Up'}
            </button>
          </p>

          <p className="auth-footer">
            ✦ Made for focused learning · StudyMate
          </p>
        </div>
      </div>
    )
  }

  // Dashboard
  const renderDashboard = () => (
    <>
      <section className="welcome">
        <div className="welcome-copy">
          <p className="eyebrow">YOUR STUDY PARTNER, ALWAYS.</p>

          <h1>
            Learn Smarter.
            <br />
            <span>Achieve Bigger.</span>
          </h1>

          <p>
            StudyMate is your AI-powered study companion. Get answers,
            create notes, take quizzes and prepare for your exams — all
            in one place.
          </p>
        </div>

        <div className="welcome-art">
          <img
            src={studyBuddy}
            alt="StudyMate hamster companion"
            className="study-buddy"
          />

          <span>Better Learning</span>
          <strong>Brighter Future ↗</strong>
        </div>
      </section>

      <form
        className="prompt-bar"
        onSubmit={(e) => {
          e.preventDefault()

          if (prompt.trim()) {
            setActivePage('AI Chat')
          }
        }}
      >
        <span>✧</span>

        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask anything... Explain a topic, create notes, take a quiz"
        />

        <button type="submit" aria-label="Ask StudyMate">
          ➜
        </button>
      </form>

      <section className="tool-grid">
        {tools.map((tool) => (
          <button
            className={`tool-card ${tool.color}`}
            key={tool.name}
            onClick={() => openTool(tool.name)}
          >
            <span className="tool-icon">{tool.icon}</span>

            <h3>{tool.name}</h3>

            <p>{tool.description}</p>

            <span className="tool-arrow">↗</span>
          </button>
        ))}
      </section>

      <section className="dashboard-bottom">
        <div className="panel activity-panel">
          <div className="panel-heading">
            <h2>Your Stats</h2>

            <button onClick={() => openTool('Study Library')}>
              View all →
            </button>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-icon">▤</span>
              <strong>{homeNotesCount}</strong>
              <small>Notes Saved</small>
            </div>

            <div className="stat-card">
              <span className="stat-icon">◎</span>
              <strong>{homeQuizAttempts.length}</strong>
              <small>Quizzes Taken</small>
            </div>

            <div className="stat-card">
              <span className="stat-icon">✧</span>
              <strong>{homeChatCount}</strong>
              <small>Chat Sessions</small>
            </div>

            <div className="stat-card">
              <span className="stat-icon">▧</span>
              <strong>{homePdfCount}</strong>
              <small>PDFs Uploaded</small>
            </div>
          </div>

          {homeQuizAttempts.length > 0 && (
            <div className="quiz-recent">
              <h3>Recent Quiz Results</h3>
              {homeQuizAttempts.map((attempt, idx) => (
                <div className="quiz-recent-item" key={attempt.id || idx}>
                  <span className="quiz-subject">{attempt.subject}</span>
                  <span className="quiz-score">{attempt.score} / {attempt.total_questions}</span>
                  <span className="quiz-percentage">{Math.round(attempt.percentage)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel exams-panel">
          <div className="panel-heading">
            <h2>Study Tools</h2>

            <button onClick={() => openTool('Quiz & Exams')}>
              View all →
            </button>
          </div>

          {[
            ['Data Structures Notes', '▤', 'Create and organize study notes'],
            ['Quiz Generator', '◎', 'Test your knowledge with MCQs'],
            ['PDF Assistant', '▧', 'Upload and explore documents'],
            ['AI Chat', '✧', 'Ask questions about any topic'],
          ].map(([name, icon, desc]) => (
            <div className="activity-item" key={name} onClick={() => openTool(name)}>
              <span className="activity-icon">
                {icon}
              </span>

              <div>
                <strong>{name}</strong>
                <small>{desc}</small>
              </div>

              <span className="activity-arrow">›</span>
            </div>
          ))}
        </div>
      </section>
    </>
  )

  // All application pages
  const renderPage = () => {
    if (activePage === 'Home') {
      return renderDashboard()
    }

    if (activePage === 'My Notes') {
      return (
        <section className="page-panel">
          <p className="eyebrow">YOUR PERSONAL COLLECTION</p>

          <h1>
            My <span>Notes.</span>
          </h1>

          <p>Create and save your study notes here.</p>

          {/* Error message */}
          {noteError && (
            <p className="chat-error">{noteError}</p>
          )}

          {/* Loading state */}
          {noteSaving && (
            <p>Saving note...</p>
          )}

          {/* Create Note Editor */}
          <div className="note-editor">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Write your study note..."
              disabled={noteSaving}
            />

            <button
              className="primary-btn"
              onClick={async () => {
                if (!newNote.trim()) return
                if (!token) {
                  setNoteError('Please login to save notes.')
                  return
                }
                const success = await saveNoteToBackend({ content: newNote.trim() })
                if (success) {
                  setNewNote('')
                }
              }}
              disabled={noteSaving || !newNote.trim()}
            >
              {noteSaving ? 'Saving...' : 'Save Note +'}
            </button>
          </div>

          {/* Saved Notes List */}
          <div className="saved-notes">
            {/* Empty state */}
            {notes.length === 0 && (
              <p className="note-empty-state">
                No notes yet. Start writing a note above and save it to see it here.
              </p>
            )}

            {notes.map((note) => {
              const isEditing = editingNoteId === note.id

              return (
                <article
                  className="panel saved-note"
                  key={note.id}
                >
                  {/* Edit Mode */}
                  {isEditing ? (
                    <>
                      <textarea
                        value={editingNoteContent}
                        onChange={(e) => setEditingNoteContent(e.target.value)}
                        placeholder="Edit your note..."
                        rows={4}
                      />
                      <div className="note-edit-actions">
                        <button
                          type="button"
                          className="primary-btn"
                          onClick={() => {
                            if (!editingNoteContent.trim()) return
                            updateNoteOnBackend(note.id, { content: editingNoteContent.trim() })
                            setEditingNoteId(null)
                            setEditingNoteContent('')
                          }}
                          disabled={noteSaving}
                        >
                          {noteSaving ? 'Updating...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNoteId(null)
                            setEditingNoteContent('')
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    /* View Mode */
                    <>
                      <h3>{note.title}</h3>

                      <ReactMarkdown>{note.content}</ReactMarkdown>

                      <div className="note-actions">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNoteId(note.id)
                            setEditingNoteContent(note.content)
                          }}
                        >
                          Edit Note
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            if (!token) return
                            if (!window.confirm('Delete this note permanently?')) return

                            try {
                              const response = await fetch(
                                `${API_BASE}/api/notes/${note.id}`,
                                {
                                  method: 'DELETE',
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                  },
                                }
                              )

                              if (!response.ok) {
                                throw new Error('Could not delete note.')
                              }

                              setNotes((previous) =>
                                previous.filter((item) => item.id !== note.id)
                              )
                            } catch (error) {
                              setNoteError(error.message)
                            }
                          }}
                        >
                          Delete Note
                        </button>
                      </div>
                    </>
                  )}
                </article>
              )
            })}
          </div>
        </section>
      )
    }

const studyChapters = {
  Python: [
    'Introduction to Python',
    'Variables and Data Types',
    'Operators',
    'Conditions and Loops',
    'Functions',
    'Lists, Tuples and Dictionaries',
    'OOP in Python',
  ],
'Data Structures & Algorithms': [
      'Introduction to DSA', 'Arrays', 'Linked Lists', 'Stacks',
    'Queues', 'Trees', 'Graphs', 'Searching and Sorting',
  ],
  'Operating Systems': [
    'Introduction to OS', 'Process Management', 'CPU Scheduling',
    'Threads', 'Deadlocks', 'Memory Management', 'File Systems',
  ],
  'Database Management Systems': [
    'Introduction to DBMS', 'ER Model', 'Relational Model', 'SQL',
    'Normalization', 'Transactions', 'Concurrency Control',
  ],
  'Computer Networks': [
    'Introduction to Networks', 'OSI Model', 'TCP/IP Model',
    'Network Topologies', 'IP Addressing', 'Routing', 'Transport Layer',
  ],
  'Computer Organization & Architecture': [
    'Introduction to COA', 'Number Systems', 'Boolean Algebra',
    'Logic Gates', 'Computer Arithmetic', 'Memory Organization',
    'I/O Organization',
  ],
  'Software Engineering': [
    'Introduction to SE', 'Software Development Life Cycle',
    'Waterfall Model', 'Agile Model', 'Requirement Analysis',
    'Software Design', 'Software Testing',
  ],
  'Design & Analysis of Algorithms': [
    'Introduction to Algorithms', 'Time Complexity', 'Searching',
    'Sorting', 'Divide and Conquer', 'Greedy Method',
    'Dynamic Programming',
  ],
  'Artificial Intelligence & Machine Learning': [
    'Introduction to AI', 'Introduction to ML', 'Supervised Learning',
    'Unsupervised Learning', 'Regression', 'Classification',
    'Neural Networks',
  ],
  'Web Development': [
    'HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Express.js',
    'REST APIs',
  ],
  'Java Programming': [
    'Introduction to Java', 'Variables and Data Types',
    'Control Statements', 'Arrays and Strings', 'Classes and Objects',
    'Inheritance', 'Exception Handling',
  ],
  'Engineering Mathematics': [
    'Matrices', 'Differential Calculus', 'Integral Calculus',
    'Differential Equations', 'Fourier Series', 'Laplace Transforms',
    'Probability',
  ],
}

const chapterContent = {
  'Introduction to Python': {
    introduction:
      'Python is a high-level, interpreted, general-purpose programming language known for its simple syntax and readability.',
    topics: [
      {
        title: 'What is Python?',
        explanation:
          'Python is used to build websites, automate tasks, analyze data, and develop AI applications.',
      },
      {
        title: 'Features of Python',
        explanation:
          'Python is readable, interpreted, dynamically typed, cross-platform, and has a large library ecosystem.',
      },
      {
        title: 'Where is Python used?',
        explanation:
          'Python is commonly used in web development, data science, automation, AI, and machine learning.',
      },
    ],
    
    example: 'print("Hello, World!")',
    output: 'Hello, World!',

    questions: [
      {
        question: 'What type of language is Python?',
        options: [
          'High-level programming language',
          'Machine language',
          'Assembly language',
          'Markup language',
        ],
        answer: 'High-level programming language',
      },
      {
        question: 'Which function displays output in Python?',
        options: ['input()', 'print()', 'display()', 'show()'],
        answer: 'print()',
      },
      {
        question: 'Which of these is a common use of Python?',
        options: [
          'Data analysis',
          'Only hardware repair',
          'Only image printing',
          'Only typing documents',
        ],
        answer: 'Data analysis',
      },
    ],
  },


  'Variables and Data Types': {
    introduction:
      'Variables store data in a program. Python supports different built-in data types.',
    topics: [
      {
        title: 'Variables',
        explanation:
          'A variable is a named reference used to store a value. Example: age = 21',
      },
      {
        title: 'Numbers',
        explanation:
          'Python supports integers such as 10 and floating-point values such as 10.5.',
      },
      {
        title: 'Strings',
        explanation:
          'Strings store text. Example: name = "Arjun"',
      },
      {
        title: 'Boolean',
        explanation:
          'Boolean values represent True or False.',
      },
    ],
    example: 'name = "Arjun"\nage = 21\nprint(name)\nprint(age)',
    output: 'Arjun\n21',
    questions: [
  {
    question: 'Which symbol is used to assign a value to a variable in Python?',
    options: ['=', '==', ':', '!='],
    answer: '=',
  },
  {
    question: 'Which data type is used to store text in Python?',
    options: ['int', 'str', 'float', 'bool'],
    answer: 'str',
  },
  {
    question: 'What is the data type of 10.5 in Python?',
    options: ['int', 'str', 'float', 'bool'],
    answer: 'float',
  },
],
  },
  'Operators': {
    introduction:
      'Operators are symbols used to perform operations on variables and values.',
    topics: [
      {
        title: 'Arithmetic Operators',
        explanation:
          'Arithmetic operators perform mathematical operations such as addition (+), subtraction (-), multiplication (*), and division (/).',
      },
      {
        title: 'Comparison Operators',
        explanation:
          'Comparison operators compare two values. Examples include ==, !=, >, <, >= and <=.',
      },
      {
        title: 'Logical Operators',
        explanation:
          'Logical operators combine conditions. Python provides and, or, and not.',
      },
      {
        title: 'Assignment Operators',
        explanation:
          'Assignment operators assign or update values. Examples include =, +=, -= and *=.',
      },
    ], 
    example: 'a = 10\\nb = 5\\nprint(a + b)\\nprint(a > b)',
    output: '15\\nTrue',
    questions: [
  {
    question: 'Which operator is used for multiplication in Python?',
    options: ['+', '*', '/', '%'],
    answer: '*',
  },
  {
    question: 'What is the result of 10 // 3 in Python?',
    options: ['3', '3.33', '1', '0'],
    answer: '3',
  },
  {
    question: 'Which operator checks whether two values are equal?',
    options: ['=', '==', '!=', '>='],
    answer: '==',
  },
],
  },  
  'Conditions and Loops': {
    introduction:
      'Conditions help a program make decisions, while loops repeat a block of code.',
    topics: [
      {
        title: 'if Statement',
        explanation:
          'The if statement executes code when a given condition is True.',
      },
      {
        title: 'if-else Statement',
        explanation:
          'The if-else statement chooses between two blocks of code depending on a condition.',
      },
      {
        title: 'for Loop',
        explanation:
          'A for loop repeats code for each item in a sequence.',
      },
      {
        title: 'while Loop',
        explanation:
          'A while loop repeats code as long as its condition remains True.',
      },
    ],
    example: 'age = 18\\nif age >= 18:\\n    print("Eligible")\\n\\nfor i in range(3):\\n    print(i)',
    output: 'Eligible\\n0\\n1\\n2',
  questions: [
  {
    question: 'Which keyword is used to check a condition in Python?',
    options: ['if', 'for', 'def', 'print'],
    answer: 'if',
  },
  {
    question: 'Which loop is commonly used to iterate over a sequence?',
    options: ['if', 'for', 'else', 'def'],
    answer: 'for',
  },
  {
    question: 'Which keyword executes when the if condition is false?',
    options: ['while', 'else', 'break', 'continue'],
    answer: 'else',
  },
],
  }, 
  'Functions': {
    introduction:
      'A function is a reusable block of code that performs a specific task.',
    topics: [
      {
        title: 'Defining a Function',
        explanation:
          'Use the def keyword to create a function in Python.',
      },
      {
        title: 'Calling a Function',
        explanation:
          'A function runs when you call it using its name followed by parentheses.',
      },
      {
        title: 'Parameters and Arguments',
        explanation:
          'Parameters receive values, while arguments are the actual values passed to a function.',
      },
      {
        title: 'Return Statement',
        explanation:
          'The return statement sends a result back from a function.',
      },
    ],
    example: 'def add(a, b):\n    return a + b\n\nresult = add(10, 5)\nprint(result)',
    output: '15',
    questions: [
  {
    question: 'Which keyword is used to define a function in Python?',
    options: ['func', 'define', 'def', 'function'],
    answer: 'def',
  },
  {
    question: 'Which keyword sends a value back from a function?',
    options: ['print', 'return', 'break', 'continue'],
    answer: 'return',
  },
  {
    question: 'What is a function parameter?',
    options: [
      'A value passed into a function',
      'A loop condition',
      'A data type',
      'A comparison operator',
    ],
    answer: 'A value passed into a function',
  },
],
  },
  'Lists, Tuples and Dictionaries': {
    introduction:
      'Python provides lists, tuples and dictionaries to store and organize collections of data.',
    topics: [
      {
        title: 'Lists',
        explanation:
          'A list is an ordered, changeable collection. Example: fruits = ["Apple", "Mango", "Banana"].',
      },
      {
        title: 'Tuples',
        explanation:
          'A tuple is an ordered collection that cannot be changed after creation. Example: colors = ("Red", "Blue").',
      },
      {
        title: 'Dictionaries',
        explanation:
          'A dictionary stores data in key-value pairs. Example: student = {"name": "Arjun", "age": 21}.',
      },
      {
        title: 'Accessing Elements',
        explanation:
          'Use indexes to access list and tuple elements, and keys to access dictionary values.',
      },
    ],
    example:
      'fruits = ["Apple", "Mango"]\nprint(fruits[0])\n\nstudent = {"name": "Arjun"}\nprint(student["name"])',
    output: 'Apple\nArjun',
    questions: [
  {
    question: 'Which data structure stores multiple items in an ordered, changeable collection?',
    options: ['Tuple', 'List', 'String', 'Integer'],
    answer: 'List',
  },
  {
    question: 'Which brackets are used to create a tuple in Python?',
    options: ['[ ]', '( )', '{ }', '< >'],
    answer: '( )',
  },
  {
    question: 'Which data structure stores data in key-value pairs?',
    options: ['List', 'Tuple', 'Dictionary', 'Set'],
    answer: 'Dictionary',
  },
],
  },
  'OOP in Python': {
    introduction:
      'Object-Oriented Programming (OOP) organizes programs using classes and objects.',
    topics: [
      {
        title: 'Classes',
        explanation:
          'A class is a blueprint used to create objects. It defines attributes and methods.',
      },
      {
        title: 'Objects',
        explanation:
          'An object is an instance of a class containing data and behavior.',
      },
      {
        title: 'Constructor',
        explanation:
          'The __init__() method initializes an object when it is created.',
      },
      {
        title: 'Inheritance',
        explanation:
          'Inheritance allows one class to reuse properties and methods of another class.',
      },
    ],
    example:
      'class Student:\n    def __init__(self, name):\n        self.name = name\n\nstudent = Student("Arjun")\nprint(student.name)',
    output: 'Arjun',
    questions: [
  {
    question: 'What does OOP stand for?',
    options: [
      'Object-Oriented Programming',
      'Object-Ordered Process',
      'Open Operating Program',
      'Object Output Programming',
    ],
    answer: 'Object-Oriented Programming',
  },
  {
    question: 'Which keyword is used to create a class in Python?',
    options: ['object', 'class', 'def', 'create'],
    answer: 'class',
  },
  {
    question: 'What is an object in Python?',
    options: [
      'An instance of a class',
      'A type of loop',
      'A Python operator',
      'A built-in module',
    ],
    answer: 'An instance of a class',
  },
],
  },
    'Introduction to DSA': {
    introduction:
      'Data Structures and Algorithms (DSA) help organize data efficiently and solve computational problems step by step.',
    topics: [
      {
        title: 'What is a Data Structure?',
        explanation:
          'A data structure is a way of organizing and storing data so it can be accessed and modified efficiently.',
      },
      {
        title: 'What is an Algorithm?',
        explanation:
          'An algorithm is a finite sequence of clear steps used to solve a particular problem.',
      },
      {
        title: 'Why is DSA Important?',
        explanation:
          'DSA helps improve program efficiency, optimize memory usage, and solve problems effectively.',
      },
    ],
    example:
      'numbers = [10, 20, 30, 40]\nprint(numbers[0])\nprint(numbers[2])',
    output: '10\n30',
    questions: [
      {
        question: 'What does DSA stand for?',
        options: [
          'Data Structures and Algorithms',
          'Digital Systems and Applications',
          'Data Software and Architecture',
          'Dynamic Storage and Access',
        ],
        answer: 'Data Structures and Algorithms',
      },
      {
        question: 'What is a data structure?',
        options: [
          'A way to organize and store data',
          'A programming language',
          'A computer operating system',
          'A type of hardware device',
        ],
        answer: 'A way to organize and store data',
      },
      {
        question: 'What is an algorithm?',
        options: [
          'A sequence of steps to solve a problem',
          'A collection of computer hardware',
          'A type of database',
          'A programming language',
        ],
        answer: 'A sequence of steps to solve a problem',
      },
    ],
  },

  'Arrays': {
    introduction:
      'An array is a linear data structure that stores multiple elements of the same type in a continuous sequence. Each element can be accessed using an index.',
    topics: [
      {
        title: 'What is an Array?',
        explanation:
          'An array stores multiple values in a single variable. It helps organize related data.',
      },
      {
        title: 'Array Indexing',
        explanation:
          'Each array element has an index. In most programming languages, indexing starts from 0.',
      },
      {
        title: 'Array Operations',
        explanation:
          'Common array operations include traversal, insertion, deletion, searching, and updating elements.',
      },
    ],
    example:
      'numbers = [10, 20, 30, 40]\nprint(numbers[0])\nprint(numbers[2])',
    output: '10\n30',
    questions: [
      {
        question: 'What is an array?',
        options: [
          'A collection of elements stored in sequence',
          'A type of loop',
          'A programming language',
          'A database management system',
        ],
        answer: 'A collection of elements stored in sequence',
      },
      {
        question: 'In most programming languages, what is the first array index?',
        options: ['0', '1', '-1', '2'],
        answer: '0',
      },
      {
        question: 'Which is a common array operation?',
        options: ['Traversal', 'Compilation', 'Installation', 'Formatting'],
        answer: 'Traversal',
      },
    ],
  },

  'Linked Lists': {
    introduction:
      'A linked list is a linear data structure made up of nodes. Each node stores data and a reference to the next node.',
    topics: [
      {
        title: 'What is a Node?',
        explanation:
          'A node is an individual element of a linked list. It contains data and a link to another node.',
      },
      {
        title: 'Types of Linked Lists',
        explanation:
          'Common types include singly linked lists, doubly linked lists, and circular linked lists.',
      },
      {
        title: 'Linked List Operations',
        explanation:
          'Common operations include insertion, deletion, traversal, and searching.',
      },
    ],
    example:
      'class Node:\n    def __init__(self, data):\n        self.data = data\n        self.next = None\n\nfirst = Node(10)\nsecond = Node(20)\nfirst.next = second\nprint(first.data)\nprint(first.next.data)',
    output: '10\n20',
    questions: [
      {
        question: 'What is a linked list made up of?',
        options: ['Nodes', 'Rows', 'Tables', 'Functions'],
        answer: 'Nodes',
      },
      {
        question: 'What does a node store in a singly linked list?',
        options: [
          'Data and a reference to the next node',
          'Only an index',
          'Only a memory address',
          'A complete database',
        ],
        answer: 'Data and a reference to the next node',
      },
      {
        question: 'Which is a common type of linked list?',
        options: [
          'Doubly linked list',
          'Binary search array',
          'Stacked queue',
          'Linear function list',
        ],
        answer: 'Doubly linked list',
      },
    ],
  },

  'Stacks': {
    introduction:
      'A stack is a linear data structure that follows the Last In, First Out (LIFO) principle. The element inserted last is removed first.',
    topics: [
      {
        title: 'What is a Stack?',
        explanation:
          'A stack stores elements in a sequence. Insertion and deletion take place at the top.',
      },
      {
        title: 'LIFO Principle',
        explanation:
          'LIFO means Last In, First Out. The most recently added element is the first one removed.',
      },
      {
        title: 'Stack Operations',
        explanation:
          'Push adds an element, pop removes the top element, and peek shows the top element without removing it.',
      },
    ],
    example:
      'stack = []\nstack.append(10)\nstack.append(20)\nstack.append(30)\nprint(stack.pop())\nprint(stack)',
    output: '30\n[10, 20]',
    questions: [
      {
        question: 'Which principle does a stack follow?',
        options: ['LIFO', 'FIFO', 'FILO only', 'Random order'],
        answer: 'LIFO',
      },
      {
        question: 'Which operation adds an element to a stack?',
        options: ['Push', 'Pop', 'Peek', 'Search'],
        answer: 'Push',
      },
      {
        question: 'What does the pop operation do?',
        options: [
          'Removes the top element',
          'Adds an element at the bottom',
          'Displays all elements',
          'Sorts the stack',
        ],
        answer: 'Removes the top element',
      },
    ],
  },

  'Queues': {
    introduction:
      'A queue is a linear data structure that follows the First In, First Out (FIFO) principle. The element inserted first is removed first.',
    topics: [
      {
        title: 'What is a Queue?',
        explanation:
          'A queue stores elements in sequence. New elements are added at the rear and removed from the front.',
      },
      {
        title: 'FIFO Principle',
        explanation:
          'FIFO means First In, First Out. The first element added to the queue is the first one removed.',
      },
      {
        title: 'Queue Operations',
        explanation:
          'Enqueue adds an element, dequeue removes the front element, and front shows the first element.',
      },
    ],
    example:
      'from collections import deque\n\nqueue = deque()\nqueue.append(10)\nqueue.append(20)\nqueue.append(30)\nprint(queue.popleft())\nprint(list(queue))',
    output: '10\n[20, 30]',
    questions: [
      {
        question: 'Which principle does a queue follow?',
        options: ['FIFO', 'LIFO', 'Random order', 'Priority only'],
        answer: 'FIFO',
      },
      {
        question: 'Which operation adds an element to a queue?',
        options: ['Enqueue', 'Dequeue', 'Pop', 'Peek'],
        answer: 'Enqueue',
      },
      {
        question: 'From which end is an element removed in a standard queue?',
        options: ['Front', 'Rear', 'Middle', 'Any position'],
        answer: 'Front',
      },
    ],
  },

  'Trees': {
    introduction:
      'A tree is a non-linear data structure that organizes data in a hierarchical form using nodes connected by edges.',
    topics: [
      {
        title: 'Basic Tree Terminology',
        explanation:
          'The top node is called the root. Nodes connected below it are children, and nodes without children are called leaves.',
      },
      {
        title: 'Types of Trees',
        explanation:
          'Common types include binary trees, binary search trees, and balanced trees.',
      },
      {
        title: 'Tree Traversal',
        explanation:
          'Traversal means visiting tree nodes. Common methods include preorder, inorder, and postorder.',
      },
    ],
    example:
      'class Node:\n    def __init__(self, data):\n        self.data = data\n        self.left = None\n        self.right = None\n\nroot = Node(10)\nroot.left = Node(5)\nroot.right = Node(20)\nprint(root.data)\nprint(root.left.data)\nprint(root.right.data)',
    output: '10\n5\n20',
    questions: [
      {
        question: 'Which type of data structure is a tree?',
        options: [
          'Non-linear data structure',
          'Linear data structure',
          'Primitive data type',
          'Programming language',
        ],
        answer: 'Non-linear data structure',
      },
      {
        question: 'What is the topmost node of a tree called?',
        options: ['Root', 'Leaf', 'Child', 'Edge'],
        answer: 'Root',
      },
      {
        question: 'Which is a tree traversal method?',
        options: ['Inorder', 'Enqueue', 'Push', 'Dequeue'],
        answer: 'Inorder',
      },
    ],
  },

  'Graphs': {
    introduction:
      'A graph is a non-linear data structure made up of vertices (nodes) and edges (connections). It is used to represent relationships between objects.',
    topics: [
      {
        title: 'Vertices and Edges',
        explanation:
          'Vertices represent objects or points, while edges represent connections between those vertices.',
      },
      {
        title: 'Types of Graphs',
        explanation:
          'Common types include directed graphs, undirected graphs, weighted graphs, and unweighted graphs.',
      },
      {
        title: 'Graph Traversal',
        explanation:
          'Breadth-First Search (BFS) explores nearby vertices first, while Depth-First Search (DFS) explores a path deeply before backtracking.',
      },
    ],
    example:
      'graph = {\n    "A": ["B", "C"],\n    "B": ["A", "D"],\n    "C": ["A"],\n    "D": ["B"]\n}\n\nprint(graph["A"])',
    output: "['B', 'C']",
    questions: [
      {
        question: 'What are the basic components of a graph?',
        options: [
          'Vertices and edges',
          'Arrays and indexes',
          'Stacks and queues',
          'Rows and columns',
        ],
        answer: 'Vertices and edges',
      },
      {
        question: 'Which algorithm explores nearby vertices first?',
        options: ['BFS', 'DFS', 'Binary Search', 'Merge Sort'],
        answer: 'BFS',
      },
      {
        question: 'What does an edge represent in a graph?',
        options: [
          'A connection between vertices',
          'The topmost node',
          'An array index',
          'A sorting operation',
        ],
        answer: 'A connection between vertices',
      },
    ],
  },

  'Searching and Sorting': {
    introduction:
      'Searching is the process of finding a specific element in a collection of data. Sorting arranges data in a particular order, such as ascending or descending.',
    topics: [
      {
        title: 'Linear Search',
        explanation:
          'Linear Search checks elements one by one until the target element is found or the collection ends.',
      },
      {
        title: 'Binary Search',
        explanation:
          'Binary Search works on sorted data. It repeatedly divides the search range into two halves.',
      },
      {
        title: 'Sorting Algorithms',
        explanation:
          'Common sorting algorithms include Bubble Sort, Selection Sort, Insertion Sort, and Merge Sort.',
      },
    ],
    example:
      'numbers = [40, 10, 30, 20]\nnumbers.sort()\nprint(numbers)\n\nif 30 in numbers:\n    print("Element found")',
    output: '[10, 20, 30, 40]\nElement found',
    questions: [
      {
        question: 'What is the purpose of searching?',
        options: [
          'To find a specific element',
          'To arrange all elements',
          'To delete every element',
          'To reverse a program',
        ],
        answer: 'To find a specific element',
      },
      {
        question: 'Which searching algorithm requires sorted data?',
        options: [
          'Binary Search',
          'Linear Search',
          'Sequential Search',
          'Simple Traversal',
        ],
        answer: 'Binary Search',
      },
      {
        question: 'Which algorithm is commonly used for sorting?',
        options: [
          'Bubble Sort',
          'Binary Search',
          'Linear Search',
          'Depth-First Search',
        ],
        answer: 'Bubble Sort',
      },
    ],
  },



}

if (activePage === 'Study Library') {
  return (
    <section className="page-panel">
      <p className="eyebrow">YOUR COURSE LIBRARY</p>

      <h1>
        Study <span>Library.</span>
      </h1>

      {!selectedStudySubject && (
        <div className="subject-grid">
          {Object.keys(studyChapters).map((subject) => (
            <article
              className="panel subject-card"
              key={subject}
              onClick={() => {
                setSelectedStudySubject(subject)
                setSelectedStudyChapter(null)
              }}
              style={{ cursor: 'pointer' }}
            >
              <span className="tool-icon">▤</span>
              <h3>{subject}</h3>
              <p>Explore chapters, notes and learning resources.</p>
            </article>
          ))}
        </div>
      )}

      {selectedStudySubject && (
        <div className="panel subject-chapters">
          <button
            type="button"
            className="primary-btn"
            onClick={() => {
              setSelectedStudySubject(null)
              setSelectedStudyChapter(null)
            }}
          >
            ← Back to Subjects
          </button>

          <h2>{selectedStudySubject}</h2>
          <p>Choose a chapter to start learning.</p>

          {!selectedStudyChapter ? (
            <div className="chapter-list">
              {(studyChapters[selectedStudySubject] || []).map(
                (chapter, index) => (
                  <article
                    className="panel chapter-card"
                    key={chapter}
                    onClick={() => setSelectedStudyChapter(chapter)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span>Chapter {index + 1}</span>
                    <h3>{chapter}</h3>
                    <p>Click to open chapter →</p>
                  </article>
                )
              )}
            </div>
          ) : (
            <div className="panel chapter-detail">
              <button
                type="button"
                className="primary-btn"
                onClick={() => setSelectedStudyChapter(null)}
              >
                ← Back to Chapters
              </button>

              <p className="eyebrow">CHAPTER DETAILS</p>
              <h2>{selectedStudyChapter}</h2>

              {chapterContent[selectedStudyChapter] ? (
                <div className="chapter-study-content">
                  <h3>Introduction</h3>
                  <p>
                    {chapterContent[selectedStudyChapter].introduction}
                  </p>

                  <h3>Key Concepts</h3>

                  {chapterContent[selectedStudyChapter].topics.map(
                    (topic) => (
                      <div className="chapter-topic" key={topic.title}>
                        <h4>{topic.title}</h4>
                        <p>{topic.explanation}</p>
                      </div>
                    )
                  )}

                  <h3>Practical Example</h3>
                  <pre>
                    <code>
                      {chapterContent[selectedStudyChapter].example}
                    </code>
                  </pre>

                  <h3>Expected Output</h3>
                  <pre>
                    <code>
                      {chapterContent[selectedStudyChapter].output}
                    </code>
                  </pre>

{chapterContent[selectedStudyChapter].questions && (() => {
  const questions = chapterContent[selectedStudyChapter].questions
  const keyOf = (i) => `${selectedStudyChapter}-${i}`
  const isSubmitted = !!submittedChapters[selectedStudyChapter]

  const answeredCount = questions.filter((_, i) => quizAnswers[keyOf(i)]).length
  const score = questions.filter((q, i) => quizAnswers[keyOf(i)] === q.answer).length
  const progress = (answeredCount / questions.length) * 100

 
const handleSubmit = async () => {
  if (answeredCount !== questions.length) return

  setSubmittedChapters((prev) => ({
    ...prev,
    [selectedStudyChapter]: true,
  }))

  try {
    const response = await fetch(`${API_BASE}/api/quiz-attempts/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        subject: selectedStudySubject,
        chapter: selectedStudyChapter,
        score,
        total_questions: questions.length,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Could not save quiz score.')
    }

    console.log('Quiz score saved successfully!')
  } catch (error) {
    console.error('Quiz score save error:', error.message)
  }
}


  const handleRetry = () => {
    setQuizAnswers((prev) => {
      const updated = { ...prev }
      questions.forEach((_, i) => delete updated[keyOf(i)])
      return updated
    })
    setSubmittedChapters((prev) => ({ ...prev, [selectedStudyChapter]: false }))
  }

  return (
    <div className="chapter-quiz">
      <h3>Practice Quiz</h3>
      <p>Test your understanding of this chapter.</p>

      {/* Progress bar */}
      <div className="lib-progress">
        <div className="lib-progress-track">
          <div className="lib-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <small>{answeredCount} / {questions.length} answered</small>
      </div>

      {questions.map((item, index) => {
        const selected = quizAnswers[keyOf(index)]

        return (
          <div className="chapter-topic" key={index}>
            <h4>Q{index + 1}. {item.question}</h4>

            {item.options.map((option) => {
              let cls = 'quiz-option'
              if (isSubmitted && option === item.answer) cls += ' correct'
              else if (isSubmitted && option === selected) cls += ' wrong'
              else if (option === selected) cls += ' selected'

              return (
                <button
                  type="button"
                  className={cls}
                  key={option}
                  disabled={isSubmitted}
                  onClick={() =>
                    setQuizAnswers((prev) => ({ ...prev, [keyOf(index)]: option }))
                  }
                >
                  {option}
                </button>
              )
            })}

            {isSubmitted && (
              <p className="lib-feedback">
                {selected === item.answer
                  ? '✓ Correct!'
                  : `✕ Galat. Sahi answer: ${item.answer}`}
              </p>
            )}
          </div>
        )
      })}

      {!isSubmitted ? (
        <button
          type="button"
          className="primary-btn"
          onClick={handleSubmit}
          disabled={answeredCount !== questions.length}
        >
          Submit Quiz →
        </button>
      ) : (
        <div className="panel quiz-score-card">
          <p className="eyebrow">QUIZ COMPLETED</p>
          <h2>Your Score: {score} / {questions.length}</h2>
          <p>{Math.round((score / questions.length) * 100)}% correct answers</p>
          <button type="button" className="primary-btn" onClick={handleRetry}>
            Try Again ↻
          </button>
        </div>
      )}
    </div>
  )
})()}

                </div>
              ) : (
                <p>Study material for this chapter is coming soon.</p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

  
    // PDF Assistant page
    if (activePage === 'PDF Assistant') {
      return (
        <section className="page-panel pdf-page">
          <p className="eyebrow">YOUR PERSONAL PDF READER</p>

          <h1>
            PDF <span>Assistant.</span>
          </h1>

          <p className="pdf-intro">
            Turn your study documents into clear summaries, important
            topics and useful exam questions.
          </p>

          {/* Upload section */}
          <div className="panel pdf-upload-card">
            <div className="pdf-upload-heading">
              <span className="pdf-section-icon">▤</span>
              <div>
                <h2>Upload your document</h2>
                <p>Choose a PDF to begin your study session.</p>
              </div>
            </div>

            <form onSubmit={handlePdfUpload}>
              <div className="pdf-upload-area">
  <span className="pdf-upload-symbol">↑</span>
  <h3>{pdfFile ? pdfFile.name : 'Choose your PDF file'}</h3>
  <p>PDF format · Maximum file size 10 MB</p>

  <label className="pdf-browse-btn" htmlFor="pdf-file-input">
    <span>＋</span>
    Choose PDF File
  </label>

  <input
    id="pdf-file-input"
    className="pdf-hidden-input"
    type="file"
    accept=".pdf,application/pdf"
    onChange={(e) => {
      const selectedFile = e.target.files?.[0] || null
      setPdfFile(selectedFile)
      clearPdfResults()
    }}
  />
</div>
              {pdfFile && (
                <div className="pdf-selected-file">
                  <span>▤</span>
                  <span>{pdfFile.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPdfFile(null)
                      clearPdfResults()
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}

              <button
                className="primary-btn pdf-generate-btn"
                type="submit"
                disabled={!pdfFile || pdfLoading}
              >
                {pdfLoading ? '✧ Processing your PDF...' : 'Generate Study Material →'}
              </button>
            </form>

            {pdfError && (
              <p className="chat-error">{pdfError}</p>
            )}

            {pdfLoading && (
              <div className="pdf-loading">
                <span className="pdf-loader">✧</span>
                <p>StudyMate is reading your document...</p>
                <small>This may take a little while.</small>
              </div>
            )}
          </div>

          {/* Results */}
          {(pdfSummary || pdfTopics || pdfQuestions) && (
            <>
              <div className="pdf-results-heading">
                <div>
                  <p className="eyebrow">YOUR STUDY MATERIAL</p>
                  <h2>Document Insights.</h2>
                  {pdfPageCount !== null && (
                    <p>{pdfPageCount} pages processed successfully</p>
                  )}
                </div>

                <button
                  className="pdf-download-btn"
                  type="button"
                  onClick={downloadPdfSummary}
                >
                  ↓ Download Report
                </button>
              </div>

              {/* Summary */}
              <article className="panel pdf-content-card">
                <div className="pdf-card-heading">
                  <span className="pdf-section-icon">✧</span>
                  <div>
                    <h2>01. PDF Summary</h2>
                    <p>Understand the document at a glance.</p>
                  </div>
                </div>

                <div className="chat-markdown pdf-markdown">
                  <ReactMarkdown>{pdfSummary}</ReactMarkdown>
                </div>
              </article>

              {/* Topics */}
              <article className="panel pdf-content-card">
                <div className="pdf-card-heading">
                  <span className="pdf-section-icon">▤</span>
                  <div>
                    <h2>02. Key Topics</h2>
                    <p>Important concepts covered in your PDF.</p>
                  </div>
                </div>

                <div className="chat-markdown pdf-markdown">
                  <ReactMarkdown>
                    {pdfTopics || 'No topics were returned for this document.'}
                  </ReactMarkdown>
                </div>
              </article>

              {/* Questions */}
              <article className="panel pdf-content-card">
                <div className="pdf-card-heading">
                  <span className="pdf-section-icon">◎</span>
                  <div>
                    <h2>03. Important Questions</h2>
                    <p>Questions to help you prepare for exams.</p>
                  </div>
                </div>

                <div className="chat-markdown pdf-markdown">
                  <ReactMarkdown>
                    {pdfQuestions || 'No questions were returned for this document.'}
                  </ReactMarkdown>
                </div>
              </article>

              {/* Ask PDF */}
              <article className="panel pdf-chat-card">
                <div className="pdf-card-heading">
                  <span className="pdf-section-icon">✧</span>
                  <div>
                    <h2>04. Ask StudyMate</h2>
                    <p>Ask questions about the uploaded document.</p>
                  </div>
                </div>

                <div className="pdf-chat-welcome">
                  <img src={studyBuddy} alt="StudyMate assistant" />
                  <div>
                    <strong>Let's understand this PDF together.</strong>
                    <p>
                      Ask about a definition, concept or topic from
                      your uploaded document.
                    </p>
                  </div>
                </div>

                {pdfAnswer && (
                  <div className="pdf-answer">
                    <div className="pdf-answer-label">
                      <span>✧</span> STUDYMATE ANSWER
                    </div>
                    <div className="chat-markdown pdf-markdown">
                      <ReactMarkdown>{pdfAnswer}</ReactMarkdown>
                    </div>
                  </div>
                )}

                <form
                  className="pdf-chat-form"
                  onSubmit={handlePdfQuestion}
                >
                  <input
                    type="text"
                    value={pdfQuestion}
                    onChange={(e) => setPdfQuestion(e.target.value)}
                    placeholder="Ask something about your PDF..."
                    disabled={pdfLoading}
                  />

                  <button
                    className="primary-btn"
                    type="submit"
                    disabled={!pdfQuestion.trim() || pdfLoading}
                  >
                    {pdfLoading ? 'Thinking...' : 'Ask →'}
                  </button>
                </form>

                <div className="pdf-chat-hint">
                  ✦ Answers are based on the uploaded document.
                </div>
              </article>
            </>
          )}

          {/* Saved PDF History */}
          {savedPdfs.length > 0 && (
            <section className="saved-pdfs-section">
              <h3>Your Saved PDFs</h3>
              {savedPdfs.map((pdf) => (
                <article
                  className="panel saved-pdf-card"
                  key={pdf.id}
                  onClick={() => {
                    setPdfSummary(pdf.summary || '')
                    setPdfTopics(pdf.topics || '')
                    setPdfQuestions(pdf.questions || '')
                    setPdfPageCount(pdf.page_count || 0)
                    setPdfFile({ name: pdf.filename })
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div>
                    <strong>{pdf.filename}</strong>
                    <small>
                      {pdf.page_count
                        ? `${pdf.page_count} pages`
                        : 'Processing...'}
                    </small>
                  </div>
                  <span className="arrow">↗</span>
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeletePdf(pdf.id)
                    }}
                    title="Delete PDF"
                  >
                    ✕
                  </button>
                </article>
              ))}
            </section>
          )}

          {savedPdfs.length === 0 && !pdfFile && (
            <section className="pdf-empty-state">
              <p>Your uploaded PDFs will appear here.</p>
            </section>
          )}
        </section>
      )
    }

// Quiz Generator page
if (activePage === 'Quiz & Exams') {
  return (
    <section className="page-panel quiz-page">
      <p className="eyebrow">TEST YOUR KNOWLEDGE</p>

      <h1>
        Quiz <span>Generator.</span>
      </h1>

      <p className="quiz-intro">
        Choose a topic, generate your quiz and track your score.
      </p>

      <form className="panel quiz-generator-card" onSubmit={handleGenerateQuiz}>
        <h2>✧ Create a new quiz</h2>

        <label htmlFor="quiz-topic">Enter your topic</label>
        <input
          id="quiz-topic"
          value={quizTopic}
          onChange={(e) => setQuizTopic(e.target.value)}
          placeholder="Example: Data Structures, DBMS, Python..."
        />

        <label htmlFor="quiz-count">Number of questions</label>
        <select
          id="quiz-count"
          value={quizCount}
          onChange={(e) => setQuizCount(Number(e.target.value))}
        >
          <option value={5}>5 Questions</option>
          <option value={7}>7 Questions</option>
          <option value={10}>10 Questions</option>
        </select>

        <button
          className="primary-btn"
          type="submit"
          disabled={quizLoading}
        >
          {quizLoading ? 'Generating Quiz...' : 'Generate Quiz →'}
        </button>

        {quizError && <p className="chat-error">{quizError}</p>}
      </form>

      {currentQuiz && (
        <section className="quiz-results">
          <div className="quiz-heading">
            <div>
              <p className="eyebrow">YOUR PRACTICE SESSION</p>
              <h2>{currentQuiz.title}</h2>
            </div>
            <span>{currentQuiz.questions.length} Questions</span>
          </div>

          {currentQuiz.questions.map((question, index) => (
            <article className="panel quiz-question-card" key={index}>
              <p className="quiz-question-number">
                QUESTION {index + 1}
              </p>

              <h3>{question.question}</h3>

              <div className="quiz-options">
                {question.options.map((option, optionIndex) => {
                  const isSelected =
                    selectedAnswers[index] === option

                  const isCorrect =
                    question.correct_answer === option

                  let optionClass = ''

                  if (quizSubmitted && isCorrect) {
                    optionClass = 'correct'
                  } else if (
                    quizSubmitted &&
                    isSelected &&
                    !isCorrect
                  ) {
                    optionClass = 'wrong'
                  } else if (isSelected) {
                    optionClass = 'selected'
                  }

                  return (
                    <button
                      type="button"
                      key={optionIndex}
                      className={`quiz-option ${optionClass}`}
                      onClick={() => selectQuizAnswer(index, option)}
                      disabled={quizSubmitted}
                    >
                      <span>
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      {option}
                    </button>
                  )
                })}
              </div>

              {quizSubmitted && (
                <div className="quiz-explanation">
                  <strong>
                    {selectedAnswers[index] === question.correct_answer
                      ? '✓ Correct answer'
                      : '✕ Correct answer: ' + question.correct_answer}
                  </strong>
                  <p>{question.explanation}</p>
                </div>
              )}
            </article>
          ))}

          {!quizSubmitted ? (
            <button
              className="primary-btn quiz-submit-btn"
              onClick={submitQuiz}
            >
              Submit Quiz →
            </button>
          ) : (
            <div className="panel quiz-score-card">
              <p className="eyebrow">QUIZ COMPLETED</p>
              <h2>
                Your Score: {quizScore} / {currentQuiz.questions.length}
              </h2>
              <p>
                {Math.round(
                  (quizScore / currentQuiz.questions.length) * 100
                )}% correct answers
              </p>

              <button
                className="primary-btn"
                onClick={() => {
                  setCurrentQuiz(null)
                  setSelectedAnswers({})
                  setQuizSubmitted(false)
                  setQuizError('')
                }}
              >
                Create Another Quiz →
              </button>
            </div>
          )}
        </section>
      )}

      <section className="saved-quizzes-section">
        <div className="quiz-heading">
          <h2>Saved Quizzes</h2>
          <button
            type="button"
            onClick={loadSavedQuizzes}
          >
            ↻ Refresh
          </button>
        </div>

        {savedQuizzes.length === 0 ? (
          <p className="quiz-empty">
            Your saved quizzes will appear here.
          </p>
        ) : (
          savedQuizzes.map((quiz) => (
            <article className="panel saved-quiz-item" key={quiz.id}>
              <div>
                <strong>{quiz.title}</strong>
                <p>{quiz.questions.length} questions</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCurrentQuiz(quiz)
                  setSelectedAnswers({})
                  setQuizSubmitted(false)
                  setQuizError('')
                }}
              >
                Open
              </button>

              <button
                type="button"
                onClick={() => deleteSavedQuiz(quiz.id)}
              >
                Delete
              </button>
            </article>
          ))
        )}
      </section>
    </section>
  )
}
// Notice Generator page
if (activePage === 'Notice Generator') {
  return (
    <section className="page-panel">
      <p className="eyebrow">SMART CAMPUS TOOLS</p>

      <h1>
        Notice <span>Generator.</span>
      </h1>

      <div className="panel notice-generator-card">
        <h2>Create a College Notice</h2>

        <label>Notice Topic</label>
        <input
          type="text"
          value={noticeTopic}
          onChange={(e) => setNoticeTopic(e.target.value)}
          placeholder="e.g. Annual Sports Day"
        />

        <label>Notice Details</label>
        <textarea
          value={noticeDetails}
          onChange={(e) => setNoticeDetails(e.target.value)}
          placeholder="Enter event date, venue and instructions..."
          rows={5}
        />

        {noticeError && (
          <p className="chat-error">{noticeError}</p>
        )}

        <button
          type="button"
          className="primary-btn"
          onClick={handleGenerateNotice}
          disabled={noticeLoading}
        >
          {noticeLoading ? 'Generating...' : '✧ Generate Notice'}
        </button>
      </div>

      {generatedNotice && (
        <div className="panel generated-notice">
          <div className="notice-result-heading">
            <h2>Generated Notice</h2>
            <button
              type="button"
              onClick={() =>
                navigator.clipboard.writeText(generatedNotice)
              }
            >
              Copy Notice
            </button>
          </div>

          <ReactMarkdown>{generatedNotice}</ReactMarkdown>
        </div>
      )}

      {/* Saved Notices List */}
      {savedNotices.length > 0 && (
        <div className="saved-notices">
          <h3>Saved Notices</h3>
          {savedNotices.map((notice) => (
            <article className="saved-notice" key={notice.id}>
              <h3>{notice.title}</h3>
              <div className="chat-markdown">
                <ReactMarkdown>{notice.content}</ReactMarkdown>
              </div>
              <div className="notice-meta">
                <span className="notice-date">
                  {new Date(notice.created_at).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                  {new Date(notice.created_at).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </span>
                <button
                  type="button"
                  className="delete-btn"
                  onClick={async () => {
                    try {
                      const response = await fetch(
                        `${API_BASE}/api/notices/${notice.id}`,
                        {
                          method: 'DELETE',
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                        }
                      )
                      if (!response.ok) throw new Error('Could not delete notice.')
                      setSavedNotices((prev) => prev.filter((n) => n.id !== notice.id))
                    } catch (error) {
                      console.error(error)
                    }
                  }}
                  aria-label="Delete notice"
                  title="Delete notice"
                >
                  ✕
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
// Notes Generator page
if (activePage === 'Notes Generator') {
  return (
    <section className="page-panel">
      <p className="eyebrow">SMART STUDY TOOLS</p>

      <h1>
        Notes <span>Generator.</span>
      </h1>

      <div className="panel notice-generator-card">
        <h2>Generate Study Notes</h2>

        <label>Enter Topic</label>
        <input
          type="text"
          value={noteTopic}
          onChange={(e) => setNoteTopic(e.target.value)}
          placeholder="e.g. Operating System"
        />

        {noteError && (
          <p className="chat-error">{noteError}</p>
        )}

        <button
          type="button"
          className="primary-btn"
          onClick={handleGenerateNotes}
          disabled={noteLoading}
        >
          {noteLoading ? 'Generating...' : '✧ Generate Notes'}
        </button>
      </div>

      {generatedNotes && (
        <div className="panel generated-notice">
          <div className="notice-result-heading">
            <h2>Generated Study Notes</h2>
            <button
              type="button"
              onClick={() =>
                navigator.clipboard.writeText(generatedNotes)
              }
            >
              Copy Notes
            </button>
          </div>

          <ReactMarkdown>{generatedNotes}</ReactMarkdown>
        </div>
      )}
    </section>
  )
}
    // AI Chat page
    if (activePage === 'AI Chat') {
      return (
        <section className="page-panel">
          <p className="eyebrow">YOUR AI STUDY COMPANION</p>

          <h1>
            AI <span>Chat.</span>
          </h1>

          <div className="panel chat-placeholder">
            {chatMessages.length === 0 ? (
              <div className="chat-welcome">
                <span className="large-symbol">✧</span>

                <h2>What would you like to learn today?</h2>

                <p>
                  Ask a question and your StudyMate assistant will help you.
                </p>
              </div>
            ) : (
              <div className="chat-active-heading">
                <span>✧</span>
                <strong>Your StudyMate Conversation</strong>
              </div>
            )}

            <div className="chat-history-panel">
              <div className="chat-history-heading">
                <h3>Chat History</h3>

                <button type="button" onClick={startNewChat}>
                  + New Chat
                </button>
              </div>

              <div className="chat-history-list">
                {conversations.length === 0 ? (
                  <p className="chat-history-empty">
                    No previous conversations yet.
                  </p>
                ) : (
                  conversations.map((chat) => (
                    <div
                      key={chat.conversation_id}
                      className={`chat-history-item ${
                        activeConversationId === chat.conversation_id
                          ? 'active'
                          : ''
                      }`}
                    >
                      <button
                        type="button"
                        className="chat-history-open"
                        onClick={() =>
                          openConversation(chat.conversation_id)
                        }
                      >
                        <span>✧</span>
                        <span>
                          {chat.title || 'Previous conversation'}
                        </span>
                      </button>

                      <button
                        type="button"
                        className="chat-history-delete"
                        aria-label="Delete conversation"
                        onClick={() =>
                          deleteConversation(chat.conversation_id)
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {chatMessages.length === 0 && (
              <div className="suggested-questions">
                <h3>Try asking something</h3>

                {[
                  'What is DSA?',
                  'What is an Array?',
                  'What is DBMS?',
                  'What is a Stack?',
                  'What is a Queue?',
                  'What is Binary Search?',
                ].map((question) => (
                  <button
                    key={question}
                    type="button"
                    className="suggestion-btn"
                    onClick={() => setPrompt(question)}
                  >
                    ✧ {question}
                  </button>
                ))}
              </div>
            )}

            {chatError && (
              <p className="chat-error">{chatError}</p>
            )}

            {chatLoading && (
              <div className="chat-message assistant">
                <strong>StudyMate AI</strong>
                <p>Thinking... ✧</p>
              </div>
            )}

            <div className="chat-messages">
              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={`chat-message ${message.role}`}
                >
                  <strong>
                    {message.role === 'user'
                      ? 'You'
                      : 'StudyMate AI'}
                  </strong>

                  <div className="chat-markdown">
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>

            <form
              className="prompt-bar"
              onSubmit={handleSendMessage}
            >
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask your study question..."
              />

              <button
                type="submit"
                aria-label="Send message"
                disabled={chatLoading}
              >
                {chatLoading ? '...' : '➜'}
              </button>
            </form>
          </div>
        </section>
      )
    }

    return (
      <section className="page-panel">
        <p className="eyebrow">STUDYMATE WORKSPACE</p>

        <h1>
          {activePage.split(' ')[0]}{' '}
          <span>
            {activePage.split(' ').slice(1).join(' ')}.
          </span>
        </h1>

        <div className="panel feature-placeholder">
          <span className="large-symbol">✧</span>

          {activePage === 'Progress' ? (
            <>
              <h2>My Progress</h2>
              <p>Your quiz performance and learning history.</p>

              <div className="progress-summary">
                <div className="progress-stat-card">
                  <h3>Total Quizzes</h3>
                  <p>{quizHistory.length}</p>
                </div>

                <div className="progress-stat-card">
                  <h3>Average Score</h3>
                  <p>
                    {quizHistory.length
                      ? Math.round(
                          quizHistory.reduce(
                            (sum, item) => sum + item.percentage,
                            0
                          ) / quizHistory.length
                        )
                      : 0}
                    %
                  </p>
                </div>

                <div className="progress-stat-card">
                  <h3>Best Score</h3>
                  <p>
                    {quizHistory.length
                      ? Math.max(...quizHistory.map((item) => item.percentage))
                      : 0}
                    %
                  </p>
                </div>
              </div>

              {historyLoading && <p>Loading quiz history...</p>}

              {historyError && (
                <p className="coming-soon">{historyError}</p>
              )}

              {!historyLoading && !historyError && quizHistory.length === 0 && (
                <p className="coming-soon">
                  No quiz attempts yet. Complete a quiz to see your progress
                  here.
                </p>
              )}

              {!historyLoading && quizHistory.length > 0 && (
                <>
                  <div className="subject-performance">
                    <h3>Subject-wise Performance</h3>

                    {[...new Set(quizHistory.map((item) => item.subject))].map(
                      (subject) => {
                        const subjectAttempts = quizHistory.filter(
                          (item) => item.subject === subject
                        )

                        const average = Math.round(
                          subjectAttempts.reduce(
                            (sum, item) => sum + item.percentage,
                            0
                          ) / subjectAttempts.length
                        )

                        return (
                          <div
                            className="subject-performance-item"
                            key={subject}
                          >
                            <div className="subject-performance-heading">
                              <strong>{subject}</strong>
                              <span>{average}%</span>
                            </div>

                            <div className="subject-progress-track">
                              <div
                                className="subject-progress-fill"
                                style={{ width: `${average}%` }}
                              />
                            </div>

                            <small>
                              {subjectAttempts.length} quiz attempts
                            </small>
                          </div>
                        )
                      }
                    )}
                  </div>

                  <div className="quiz-history-list">
                    {quizHistory.map((attempt) => (
                      <div className="quiz-history-card" key={attempt.id}>
                        <h3>{attempt.subject}</h3>
                        <p>Chapter: {attempt.chapter}</p>
                        <p>
                          Score: {attempt.score} / {attempt.total_questions}
                        </p>
                        <p>Percentage: {attempt.percentage}%</p>
                        <p>
                          Date: {new Date(attempt.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div className="settings-panel">
                <h2>Settings</h2>

                <div className="settings-section">
                  <h3>Profile Preferences</h3>
                  <div className="settings-row">
                    <span className="setting-label">Display Name</span>
                    <span className="setting-value">{currentUser?.name || 'Not set'}</span>
                  </div>
                  <div className="settings-row">
                    <span className="setting-label">Email</span>
                    <span className="setting-value">{currentUser?.email || 'Not set'}</span>
                  </div>
                </div>

                <div className="settings-section">
                  <h3>Appearance</h3>
                  <div className="settings-row">
                    <span className="setting-label">Theme</span>
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      className="theme-select"
                    >
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                    </select>
                  </div>
                </div>

                <div className="settings-section">
                  <h3>Notifications</h3>
                  <div className="settings-row">
                    <span className="setting-label">Enable Notifications</span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notifications}
                        onChange={(e) => setNotifications(e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                {saveStatus && (
                  <div className="save-status">{saveStatus}</div>
                )}

                <button className="save-btn" onClick={saveSettings}>
                  Save Changes
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    )
  }

  // Main application layout
  return (
    <div className="app">
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => setActivePage('Home')}
        >
          <span>✿</span> Study<span className="brand-lime">Mate</span>
        </button>

        <p className="sidebar-label">
          YOUR PERSONAL STUDY SPACE
        </p>

        <nav className="sidebar-nav">
          {menu.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${
                activePage === item.name ? 'active' : ''
              }`}
              onClick={() => setActivePage(item.name)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <span>✧</span>
          <p>Small steps every day lead to big results.</p>
        </div>

        <div className="sidebar-profile">
          <span className="avatar">
            {currentUser.name.charAt(0).toUpperCase()}
          </span>

          <div>
            <strong>{currentUser.name}</strong>
            <small>{currentUser.email}</small>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">YOUR LEARNING SPACE</p>
            <h2>{activePage}</h2>
          </div>

          <div className="profile">
            <span className="notification">♧</span>

            <span className="avatar">
              {currentUser.name.charAt(0).toUpperCase()}
            </span>

            <div>
              <strong>Hi, {currentUser.name}</strong>
              <small>Student</small>
            </div>

            <button className="logout-btn" onClick={logout}>
              Logout ↗
            </button>
          </div>
        </header>

        {renderPage()}

        <footer className="footer">
          Made for focused learning <span>✦</span> · StudyMate
        </footer>
      </main>

      {/* Floating hamster companion */}
      {showBuddy && (
        <div className="floating-buddy" key={activePage}>
          <span className="buddy-sparkle sparkle-one">✦</span>
          <span className="buddy-sparkle sparkle-two">✧</span>
          <span className="buddy-sparkle sparkle-three">✦</span>
          <span className="run-dust">•••</span>

          {buddyMessage && (
            <div className="buddy-message paw-reaction">
              <span>🐾</span>
              <span>🐾</span>
              <span>🐾</span>
            </div>
          )}

          <div
            className="hamster-character"
            onClick={() => setBuddyMessage('Keep going 🐾🐹')}
            style={{
              pointerEvents: 'auto',
              cursor: 'pointer',
            }}
          >
            <img
              src={studyBuddy}
              alt="Your Study Buddy"
              className="floating-buddy-image"
            />
          </div>
        </div>
      )}

      {/* Mobile navigation */}
      <nav className="mobile-nav">
        {[
          { name: 'Home', icon: '⌂' },
          { name: 'AI Chat', icon: '✧' },
          { name: 'My Notes', icon: '▤' },
          { name: 'Quiz & Exams', icon: '◎' },
          { name: 'Settings', icon: '•••' },
        ].map((item) => (
          <button
            key={item.name}
            className={
              activePage === item.name ? 'mobile-active' : ''
            }
            onClick={() => setActivePage(item.name)}
          >
            <span>{item.icon}</span>

            <small>
              {item.name === 'Quiz & Exams'
                ? 'Quiz'
                : item.name === 'My Notes'
                  ? 'Notes'
                  : item.name}
            </small>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default App