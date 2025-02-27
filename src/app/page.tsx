import Navbar from "./components/Navbar";
import BottomBar from "./components/BottomBar";
import TaskPlanner from "./pages/TaskPlanner";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col smooth-scroll">
      <main className="flex-1 flex-col flex items-center justify-center">
        <Navbar />
        <TaskPlanner />
        <BottomBar />
      </main>
    </div>
  );
}
