import Quiz from "./components/layout/quiz";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Quiz />
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
