# AI CLI System Rules

When generating code or reading instructions for this project, you MUST adhere to the following rules:

1. **Context First:** Always refer to `plan.md` and `database.md` before generating any new features to ensure alignment with the core logic.
2. **Minimalist UI:** We are targeting mobile web users. Use generous padding, large touch targets (buttons at least 44px tall), and clear typography using Tailwind.
3. **No Placeholders for DB:** When generating UI that requires data, do not leave empty div blocks. Assume the data comes from the Mongoose models defined in `database.md` and write the data fetching logic (Server Actions preferred).
4. **Algorithmic Accuracy:** The debt simplification is the most critical math in this app. Ensure all numeric calculations handle floating-point precision issues correctly (e.g., rounding to 2 decimal places or working in lowest currency units like cents/VND).
5. **Ask for Clarity:** If my prompt is ambiguous about which Phase we are currently in, ask me to specify before generating a massive amount of code.