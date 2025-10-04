import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import questions from "../layout/question";

const TIME_PER_QUESTION = 30;
const POINTS_PER_QUESTION = 20;

// Key untuk localStorage
const STORAGE_KEYS = {
  QUIZ_DATA: "quiz_data",
  PLAYER_NAME: "player_name",
};

export default function Quiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [showIntro, setShowIntro] = useState(true);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [quizStarted, setQuizStarted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [userAnswers, setUserAnswers] = useState(
    Array(questions.length).fill(null)
  );

  // Load data dari localStorage saat komponen mount
  useEffect(() => {
    const savedPlayerName = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME);
    const savedQuizData = localStorage.getItem(STORAGE_KEYS.QUIZ_DATA);

    if (savedPlayerName) {
      setPlayerName(savedPlayerName);
    }

    if (savedQuizData) {
      try {
        const parsedData = JSON.parse(savedQuizData);
        setCurrentQuestion(parsedData.currentQuestion || 0);
        setScore(parsedData.score || 0);
        setUserAnswers(
          parsedData.userAnswers || Array(questions.length).fill(null)
        );
        setQuizStarted(parsedData.quizStarted || false);
        setShowIntro(
          parsedData.showIntro !== undefined ? parsedData.showIntro : true
        );
        setShowResult(parsedData.showResult || false);

        // Jika quiz sedang berjalan, lanjutkan dari state yang disimpan
        if (parsedData.quizStarted && !parsedData.showResult) {
          setSelectedAnswer(
            parsedData.userAnswers?.[parsedData.currentQuestion] || null
          );
          setAnswered(
            parsedData.userAnswers?.[parsedData.currentQuestion] !== null
          );
        }
      } catch (error) {
        console.error("Error loading quiz data:", error);
        // Jika ada error, reset data
        localStorage.removeItem(STORAGE_KEYS.QUIZ_DATA);
      }
    }
  }, []);

  // Save data ke localStorage setiap kali state berubah
  useEffect(() => {
    if (quizStarted || showResult) {
      const quizData = {
        currentQuestion,
        score,
        userAnswers,
        quizStarted,
        showIntro,
        showResult,
        timestamp: new Date().getTime(),
      };
      localStorage.setItem(STORAGE_KEYS.QUIZ_DATA, JSON.stringify(quizData));
    }
  }, [currentQuestion, score, userAnswers, quizStarted, showIntro, showResult]);

  // Save player name ke localStorage
  useEffect(() => {
    if (playerName) {
      localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, playerName);
    }
  }, [playerName]);

  // Format time to hours, minutes and seconds
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Timer effect
  useEffect(() => {
    if (!quizStarted || answered || showResult) return;

    if (timeLeft === 0) {
      handleTimeUp();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, quizStarted, answered, showResult]);

  const handleTimeUp = () => {
    const newUserAnswers = [...userAnswers];
    newUserAnswers[currentQuestion] = selectedAnswer;
    setUserAnswers(newUserAnswers);
    setAnswered(true);
    toast.error("Waktu habis! " + questions[currentQuestion].explanation);
  };

  const startQuiz = () => {
    if (!playerName.trim()) {
      toast.error("Silakan masukkan nama terlebih dahulu!");
      return;
    }
    setQuizStarted(true);
    setShowIntro(false);
    setTimeLeft(TIME_PER_QUESTION);

    // Clear previous quiz data when starting new quiz
    const quizData = {
      currentQuestion: 0,
      score: 0,
      userAnswers: Array(questions.length).fill(null),
      quizStarted: true,
      showIntro: false,
      showResult: false,
      timestamp: new Date().getTime(),
    };
    localStorage.setItem(STORAGE_KEYS.QUIZ_DATA, JSON.stringify(quizData));
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) {
      toast.error("Silakan pilih jawaban terlebih dahulu!");
      return;
    }

    const newUserAnswers = [...userAnswers];
    newUserAnswers[currentQuestion] = selectedAnswer;
    setUserAnswers(newUserAnswers);

    setAnswered(true);
    if (selectedAnswer === questions[currentQuestion].answer) {
      setScore(score + POINTS_PER_QUESTION);
      toast.success(`Jawaban benar! +${POINTS_PER_QUESTION} poin`, {
        description: questions[currentQuestion].explanation,
      });
    } else {
      toast.error("Jawaban belum tepat", {
        description: questions[currentQuestion].explanation,
      });
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setAnswered(false);
      setSelectedAnswer(userAnswers[currentQuestion + 1]);
      setTimeLeft(TIME_PER_QUESTION);
    } else {
      setShowResult(true);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setAnswered(false);
      setSelectedAnswer(userAnswers[currentQuestion - 1]);
      setTimeLeft(TIME_PER_QUESTION);
    }
  };

  const handleQuestionNav = (index) => {
    // Hanya bisa navigasi ke soal yang belum dijawab atau soal saat ini
    if (userAnswers[index] !== null || index === currentQuestion) {
      setCurrentQuestion(index);
      setAnswered(false);
      setSelectedAnswer(userAnswers[index]);
      setTimeLeft(TIME_PER_QUESTION);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setShowResult(false);
    setAnswered(false);
    setShowIntro(true);
    setQuizStarted(false);
    setTimeLeft(TIME_PER_QUESTION);
    setSelectedAnswer(null);
    setUserAnswers(Array(questions.length).fill(null));

    // Clear quiz data from localStorage
    localStorage.removeItem(STORAGE_KEYS.QUIZ_DATA);
  };

  const startNewQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setShowResult(false);
    setAnswered(false);
    setShowIntro(true);
    setQuizStarted(false);
    setPlayerName("");
    setTimeLeft(TIME_PER_QUESTION);
    setSelectedAnswer(null);
    setUserAnswers(Array(questions.length).fill(null));

    // Clear all data from localStorage
    localStorage.removeItem(STORAGE_KEYS.QUIZ_DATA);
    localStorage.removeItem(STORAGE_KEYS.PLAYER_NAME);
  };

  const totalPossibleScore = questions.length * POINTS_PER_QUESTION;

  // Intro Screen
  if (showIntro) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-green-50 to-blue-50">
        <Card className="w-full max-w-xl shadow-none">
          <CardHeader className="text-center">
            <CardTitle className="text-xl sm:text-2xl">
              Quiz Agama Islam Kelas 1
            </CardTitle>
            <CardDescription className="text-md sm:text-lg">
              Bab 3: Basmalah
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Masukkan Nama Kamu
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Nama lengkap..."
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && startQuiz()}
                className="w-full"
              />
            </div>

            <div className="rounded-lg space-y-2">
              <h3 className="font-semibold text-blue-900">Informasi Quiz:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-blue-900">
                <p className="bg-blue-50 px-3 py-3 rounded">
                  Jumlah Pertanyaan: {questions.length}
                </p>
                <p className="bg-blue-50 px-3 py-3 rounded">
                  Waktu Pengerjaan: {formatTime(TIME_PER_QUESTION)}
                </p>
                <p className="bg-blue-50 px-3 py-3 rounded">
                  Poin Per Pertanyaan: {POINTS_PER_QUESTION}
                </p>
                <p className="bg-blue-50 px-3 py-3 rounded">
                  Total Poin Maksimal: {totalPossibleScore}
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-2">Petunjuk:</h3>
              <p className="text-sm text-yellow-800">
                Baca setiap pertanyaan dengan teliti dan pilih jawaban yang
                paling tepat. Kerjakan dengan cepat sebelum waktu habis!
              </p>
            </div>

            <Button onClick={startQuiz} className="w-full" size="lg">
              Mulai Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results Screen dengan preview jawaban
  if (showResult) {
    const percentage = (score / totalPossibleScore) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-4 px-3 sm:py-8 sm:px-4">
        <div className="sm:max-w-xl max-w-md mx-auto">
          <Card className="w-full mb-6">
            <CardHeader className="text-center">
              <CardTitle className="text-xl sm:text-2xl">
                Selamat! Quiz Selesai
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                {playerName}, ini adalah hasil quiz kamu:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">
                  {score} / {totalPossibleScore}
                </div>
                <Progress value={percentage} className="w-full" />
                <p className="text-sm text-gray-600 mt-2">
                  {percentage.toFixed(1)}%
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-center text-base sm:text-lg font-semibold">
                  {percentage === 100
                    ? "🎉 Hebat! Kamu paham betul tentang Basmalah!"
                    : percentage >= 60
                    ? "👍 Bagus! Latihan lagi ya."
                    : "💪 Ayo belajar lebih giat!"}
                </p>
                <p className="text-center text-xs sm:text-sm text-gray-600">
                  {score === totalPossibleScore
                    ? "Sempurna! Semua jawaban benar!"
                    : `Kamu menjawab ${score / POINTS_PER_QUESTION} dari ${
                        questions.length
                      } soal dengan benar`}
                </p>
              </div>

              {/* Preview Jawaban */}
              <div className="space-y-3 sm:space-y-4 grid grid-cols-1 gap-3 sm:gap-4 max-h-80 sm:max-h-96 overflow-y-auto">
                <h3 className="text-lg font-semibold">Review Jawaban:</h3>
                {questions.map((question, index) => {
                  const userAnswer = userAnswers[index];
                  const isCorrect = userAnswer === question.answer;

                  return (
                    <Card
                      key={question.id}
                      className="border-l-4 border-l-blue-500"
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                          <div className="flex-1">
                            <Badge variant="secondary" className="mb-2 text-xs">
                              Soal {index + 1}
                            </Badge>
                            <p className="font-medium text-sm sm:text-base">
                              {question.question}
                            </p>
                          </div>
                          <Badge
                            variant={isCorrect ? "correct" : "destructive"}
                            className="sm:ml-2 self-start sm:self-auto text-xs"
                          >
                            {isCorrect ? "Benar" : "Salah"}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-xs sm:text-sm">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
                            <span className="font-medium sm:w-32">
                              Jawaban Anda:
                            </span>
                            <span
                              className={
                                isCorrect ? "text-green-600" : "text-red-600"
                              }
                            >
                              {userAnswer !== null
                                ? `${String.fromCharCode(65 + userAnswer)}. ${
                                    question.options[userAnswer]
                                  }`
                                : "Tidak dijawab"}
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
                            <span className="font-medium sm:w-32">
                              Jawaban Benar:
                            </span>
                            <span className="text-green-600">
                              {String.fromCharCode(65 + question.answer)}.{" "}
                              {question.options[question.answer]}
                            </span>
                          </div>

                          {!isCorrect && userAnswer !== null && (
                            <div className="mt-2 p-2 sm:p-3 bg-yellow-50 rounded-lg text-xs sm:text-sm">
                              <span className="font-medium">Penjelasan: </span>
                              {question.explanation}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-4">
                <Button
                  onClick={restartQuiz}
                  variant="outline"
                  className="w-full"
                >
                  Ulangi Quiz
                </Button>
                <Button onClick={startNewQuiz} className="w-full">
                  Quiz Baru
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Quiz Screen
  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 min-h-screen">
      <div className="max-w-3xl mx-auto flex flex-col justify-center min-h-screen p-3 sm:p-4">
        <Card className="w-full shadow-none">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div className="px-3 py-2 flex items-center justify-center bg-gray-100 rounded-md text-sm w-full sm:w-auto">
                Soal {currentQuestion + 1} dari {questions.length}
              </div>

              {/* Time Remaining di kanan */}
              <div className="flex items-center space-x-2 sm:bg-blue-50 px-3 py-2 sm:rounded-lg sm:border sm:border-blue-200 w-full sm:w-auto justify-between sm:justify-start">
                <div className="text-center sm:text-left w-full">
                  <p className="text-xs font-medium text-blue-900 mb-1">
                    Waktu Tersisa
                  </p>
                  <p
                    className={`text-sm font-bold font-mono ${
                      timeLeft <= 10 ? "text-red-600" : "text-blue-700"
                    }`}
                  >
                    {formatTime(timeLeft)}
                  </p>
                </div>
              </div>
            </div>

            <div className="">
              <CardTitle className="text-lg sm:text-xl font-normal">
                {currentQuestion + 1}. {questions[currentQuestion].question}
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {questions[currentQuestion].options.map((option, index) => (
                <div
                  key={index}
                  className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedAnswer === index
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  } ${answered ? "cursor-default" : ""}`}
                  onClick={() => !answered && setSelectedAnswer(index)}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border mr-2 sm:mr-3 flex items-center justify-center flex-shrink-0 ${
                        selectedAnswer === index
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-400"
                      }`}
                    >
                      {selectedAnswer === index && (
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <span className="font-medium text-sm sm:text-base break-words">
                      {String.fromCharCode(65 + index)}. {option}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Button untuk setiap soal */}
            {!answered && (
              <div className="flex justify-center">
                <Button
                  onClick={handleSubmit}
                  className="w-full sm:max-w-xs"
                  disabled={selectedAnswer === null}
                  size="sm"
                >
                  Submit Jawaban
                </Button>
              </div>
            )}

            {/* Navigasi setelah submit */}
            {answered && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={prevQuestion}
                  disabled={
                    currentQuestion === 0 ||
                    userAnswers[currentQuestion - 1] !== null
                  }
                  className="w-full sm:w-auto order-2 sm:order-1"
                  size="sm"
                >
                  Prev
                </Button>

                <div className="flex gap-1 order-1 sm:order-2 mb-3 sm:mb-0">
                  {questions.map((_, index) => (
                    <button
                      key={index}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded text-xs sm:text-sm font-medium ${
                        currentQuestion === index
                          ? "bg-blue-600 text-white"
                          : userAnswers[index] !== null
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-700"
                      } ${
                        userAnswers[index] === null && index !== currentQuestion
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer"
                      }`}
                      onClick={() => handleQuestionNav(index)}
                      disabled={
                        userAnswers[index] === null && index !== currentQuestion
                      }
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>

                {currentQuestion === questions.length - 1 ? (
                  <Button
                    onClick={() => setShowResult(true)}
                    className="w-full sm:w-auto order-3"
                    size="sm"
                  >
                    Lihat Hasil
                  </Button>
                ) : (
                  <Button
                    onClick={nextQuestion}
                    disabled={userAnswers[currentQuestion + 1] !== null}
                    className="w-full sm:w-auto order-3"
                    size="sm"
                  >
                    Next
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
