import ora from "ora";
import chalk from "chalk";
export const identifyAndValidatingInput = async (input) => {
  const spinner = ora(
    chalk.green("Identifying and validating input...")
  ).start();
  if (input.includes("http://") || input.includes("https://")) {
    spinner.succeed(chalk.green("Input is a URL"));
    if (!validateUrl(input)) {
      spinner.fail(chalk.red("Invalid URL"));
      return null;
    }
    return {
      type: "url",
      value: input,
    };
  } else {
    spinner.succeed(chalk.green("Input is an IP address"));
    if (!validateIp(input)) {
      spinner.fail(chalk.red("Invalid IP address"));
      return null;
    }
    return {
      type: "ip",
      value: input,
    };
  }
};

export const validateIp = (ip) => {
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(ip)) {
    return false;
  }
  const ipParts = ip.split(".");
  for (const part of ipParts) {
    if (parseInt(part) > 255) {
      return false;
    }
  }
  return true;
};
export const validateUrl = (url) => {
  const urlRegex =
    /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
  if (!urlRegex.test(url)) {
    return false;
  }
  return true;
};
