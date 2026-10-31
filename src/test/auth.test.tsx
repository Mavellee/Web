import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Routes, Route } from "react-router-dom";
import { Login, Signup } from "../pages/auth/AuthPages";
import { axeViolations, mockApi, renderWithProviders } from "./utils";

const yearsAgo = (n: number) => `${new Date().getFullYear() - n}-01-01`;

describe("Sign up", () => {
  it("shows field errors and does not call the API when the form is invalid", async () => {
    const { calls } = mockApi({});
    renderWithProviders(<Signup />);
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByText("Please confirm you're 18 or older.")).toBeInTheDocument();
    expect(calls.filter((c) => c.key === "POST /auth/register")).toHaveLength(0);
  });

  it("blocks under-18 dates of birth before submitting", async () => {
    mockApi({});
    renderWithProviders(<Signup />);
    await userEvent.type(screen.getByLabelText("Date of birth"), yearsAgo(16));
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText("You must be 18 or older to join Mavelle.")).toBeInTheDocument();
  });

  it("submits valid details and shows server-side field errors", async () => {
    const { calls } = mockApi({
      "POST /auth/register": { status: 409, body: { error: { code: "EMAIL_TAKEN", message: "An account with this email already exists. Try logging in." } } },
    });
    renderWithProviders(<Signup />);
    await userEvent.type(screen.getByLabelText("Email"), "me@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "GoodPassword1");
    await userEvent.type(screen.getByLabelText("Date of birth"), yearsAgo(30));
    await userEvent.click(screen.getByLabelText(/I confirm I am 18/));
    await userEvent.click(screen.getByLabelText(/I agree to the/));
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("already exists");
    const sent = calls.find((c) => c.key === "POST /auth/register")!.body as Record<string, unknown>;
    expect(sent).toMatchObject({ email: "me@example.com", ageConfirmed: true, acceptTerms: true });
  });

  it("has no detectable accessibility violations", async () => {
    mockApi({});
    const { container } = renderWithProviders(<Signup />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("Log in", () => {
  it("shows the server's error without revealing whether the email exists", async () => {
    mockApi({ "POST /auth/login": { status: 401, body: { error: { code: "INVALID_CREDENTIALS", message: "That email and password do not match." } } } });
    renderWithProviders(<Login />);
    await userEvent.type(screen.getByLabelText("Email"), "someone@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "whatever123");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("That email and password do not match.");
  });

  it("sends onboarded members to Discover", async () => {
    mockApi({
      "POST /auth/login": { body: { data: { id: "u1", role: "USER", status: "ACTIVE", onboarded: true } } },
    });
    renderWithProviders(
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/app/discover" element={<p>Discover page</p>} />
      </Routes>,
    );
    await userEvent.type(screen.getByLabelText("Email"), "a@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "whatever123");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    await waitFor(() => expect(screen.getByText("Discover page")).toBeInTheDocument());
  });
});
