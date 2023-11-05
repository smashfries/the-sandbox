const { spawn } = require("child_process");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const { decode } = require("punycode");
const app = express();

app.use(express.json());
app.use(cors());

const PORT = 1000;
const LANG_CODES = ["java"];

app.get("/", (req, res) => {
  res.send("Hello world");
});

app.post("/run", (req, res) => {
  if (!req.body.code || !req.body.lang) {
    return res.status(400).send({
      error: "invalid-request",
      message: "lang and code is required in request body",
    });
  }

  if (!LANG_CODES.includes(req.body.lang)) {
    return res.status(400).send({
      error: "unsupported-lang",
      message:
        "Please use a supported language. Enter the correct language code in the request body",
    });
  }

  switch (req.body.lang) {
    case "java":
      const className = extractClassNameFromJavaClassText(
        decodeURIComponent(req.body.code),
      );

      if (!className) {
        return res.status(400).send({
          error: "invalid-code",
          message:
            "Could not detect the class name. Please provide properly formatted code.",
        });
      }

      fs.writeFile(
        process.cwd() + "/code/" + className + ".java",
        decodeURIComponent(req.body.code),
        (err) => {
          if (err) {
            console.log(err);
            return res.status(500).send({
              error: "server-error",
              message: "Failed to run your code. Please try again.",
            });
          }

          const child = spawn(
            "docker",
            [
              "run",
              "--mount",
              `type=bind,source=${process.cwd()}/code,target=/app/code`,
              "code-sandbox",
              "/app/code-execution.sh",
            ],
            {
              timeout: 5000,
            },
          );

          let output = [];

          child.stdout.on("data", (data) => {
            output.push(data.toString());
          });

          child.stderr.on("data", (data) => {
            output.push(data.toString());
          });

          child.on("close", (code) => {
            const files = fs.readdirSync(process.cwd() + "/code");
            files.forEach((file) => {
              fs.unlinkSync(process.cwd() + "/code/" + file);
            });
            const outputText = output.join("");
            console.log("exited: " + code);
            if (code == 255) {
              return res.send({
                error: "timeout",
                message:
                  "Your code ran for too long. Please modify your code and try running it again.",
              });
            } else if (code == 0) {
              return res.send({
                message: "Your code ran successfully.",
                output: outputText,
              });
            } else {
              return res.send({
                error: "code-error",
                message: "Encountered an error during compilation or runtime.",
                output: outputText,
              });
            }
          });
        },
      );
      break;

    default:
      break;
  }
});

function extractClassNameFromJavaClassText(javaClassText) {
  // Match the regular expression `public class (\w+)` to the Java class text.
  const match = /public class (\w+)/.exec(javaClassText);

  // If there is a match, return the captured class name. Otherwise, return null.
  return match ? match[1] : null;
}

app.listen(PORT, () => {
  console.log("We're up and running!");
});
