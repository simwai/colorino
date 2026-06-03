# Feature Comparison: Colorino vs. Others

Colorino is designed to be a lightweight, high-performance logging library that provides a beautiful developer experience out of the box, whether you are in Node.js or the Browser.

## Comparison Table

| Feature | **Colorino** 🎨 | **Pino** 🌲 | **Winston** ⚙️ | **Consola** 🦄 |
| :--- | :---: | :---: | :---: | :---: |
| **Primary Goal** | DX & Aesthetics | Performance (JSON) | Flexibility | CLI/DX |
| **Bundle Size** | Ultra-light | Moderate | Large | Moderate |
| **Browser Support** | Native (CSS-based) | Via Transports | Limited | Yes |
| **Theme Detection** | Auto (OSC 11) | No | No | Auto (Basic) |
| **Gradients** | Built-in | No | No | No |
| **Zero Config** | Yes | Yes | No | Yes |
| **Tree Shakeable** | Yes | Partial | No | Yes |
| **File Logging** | Native (Async) | Via Transports | Native | No |

---

## Detailed Breakdown

### 🎨 Colorino
Colorino stands out by focusing on **colorization and developer experience**. It doesn't just log text; it understands your terminal's capabilities.
- **Auto-Theme Detection:** Uses OSC 11 to detect if your terminal is in light or dark mode and adjusts its palette accordingly.
- **Gradients:** The only library in this list with native support for interpolating colors across text.
- **Node & Browser:** Works seamlessly in both environments with platform-specific optimizations (ANSI for Node, CSS for Browser).

### 🌲 Pino
Pino is the industry standard for **high-performance JSON logging** in Node.js.
- **Performance:** Designed to be as fast as possible, especially when logging JSON.
- **Philosophy:** "All natural JSON logger". It requires external "prettifiers" like `pino-pretty` for readable console output.
- **Complexity:** Higher configuration overhead for human-readable logs compared to Colorino.

### ⚙️ Winston
Winston is the **most flexible and mature** logger in the Node.js ecosystem.
- **Transports:** Incredible support for logging to almost anywhere (Databases, HTTP, Files, Cloudwatch).
- **Formatters:** Highly customizable formatting pipeline.
- **Legacy:** It is older and heavier, often overkill for modern microservices or frontend applications.

### 🦄 Consola
Consola is a **versatile console wrapper** from the UnJS ecosystem.
- **CLI Focus:** Excellent for building CLI tools (like Nuxt or Vite).
- **Interactivity:** Built-in support for prompts and progress bars.
- **Wrapping:** Can easily hijack existing `console.log` calls.

---

## Why choose Colorino?

If you want a logger that **just looks great** without any setup, detects your terminal theme automatically, and works identically in your frontend and backend code, **Colorino** is the best choice.

If you are building a high-traffic production backend where every microsecond and byte of JSON matters, **Pino** might be your pick. If you need to log directly to a legacy database, **Winston** is the way to go.
