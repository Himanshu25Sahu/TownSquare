import Hero from "./components/Hero"
import Features from "./components/Features"
import TechStack from "./components/TechStack"
import Screenshots from "./components/Screenshots"
import Developers from "./components/Developers"
import Footer from "./components/Footer"
import "./App.css"

function App() {
  return (
    <div className="app">
      <Hero />
      <Features />
      <TechStack />
      <Screenshots />
      <Developers />
      <Footer />
    </div>
  )
}

export default App
