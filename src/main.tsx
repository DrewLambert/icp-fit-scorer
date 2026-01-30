import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { validateEnvironment } from "./lib/env-validation";

validateEnvironment();

createRoot(document.getElementById("root")!).render(<App />);
