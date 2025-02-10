import Navbar from "./components/Navbar";
import BottomBar from "./components/BottomBar";
import TaskPlanner from "./pages/TaskPlanner";

export default function Home() {
  return (
    <div className="smooth-scroll">
      <Navbar />
      <TaskPlanner />
      <BottomBar />
    </div>
  );
}
