import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ProfileCard from "../components/cards/ProfileCard";
import AuthPage from "../pages/auth/AuthPage";
import Editor from "../pages/dashboard/Editor";
import { Loading, ErrorState } from "../components/common/UI";
import { sample, vcard } from "../utils/profile";
const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
  patch: vi.fn(),
}));
vi.mock("../services/api", () => ({
  api: mocks,
  errorMessage: () => "Please check the form.",
  uploadImage: vi.fn(),
}));
vi.mock("../contexts/Auth", () => ({
  useAuth: () => ({
    user: { name: "Test User", emailVerified: true },
    setUser: vi.fn(),
    refresh: vi.fn(),
  }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
describe("Authentication", () => {
  it("validates registration before sending an API request", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthPage mode="register" />
      </MemoryRouter>,
    );
    await user.click(
      screen.getByRole("button", { name: /create your free account/i }),
    );
    expect(await screen.findByText("Enter your name")).toBeInTheDocument();
    expect(mocks.post).not.toHaveBeenCalled();
  });
  it("shows server errors without losing the login form", async () => {
    mocks.post.mockRejectedValueOnce(new Error("offline"));
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>,
    );
    await user.type(
      screen.getByLabelText("Email address"),
      "hello@example.com",
    );
    await user.type(screen.getByLabelText("Password"), "WrongPassword1");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Please check the form.",
    );
    expect(screen.getByLabelText("Email address")).toHaveValue(
      "hello@example.com",
    );
  });
});
describe("Public identity", () => {
  it.each(["studio", "minimal", "editorial"])(
    "renders the %s template and functional contacts",
    (template) => {
      const { container } = render(
        <ProfileCard profile={{ ...sample, template }} />,
      );
      expect(
        screen.getByRole("heading", { name: "Alex Morgan" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /email me/i })).toHaveAttribute(
        "href",
        "mailto:alex@example.com",
      );
      expect(container.firstChild).toHaveClass(`template-${template}`);
    },
  );
  it("omits unconfigured sections", () => {
    render(
      <ProfileCard
        profile={{
          ...sample,
          biography: "",
          email: "",
          website: "",
          address: "",
          socials: [],
        }}
      />,
    );
    expect(screen.queryByText("A little about me")).not.toBeInTheDocument();
    expect(screen.queryByText("Selected work")).not.toBeInTheDocument();
  });
  it("escapes delimiters and newlines in vCard exports", () => {
    const data = vcard({ ...sample, displayName: "Alex;X, Y\nTITLE:Injected" });
    expect(data).toContain("FN:Alex\\;X\\, Y\\nTITLE:Injected");
    expect(
      data.split("\r\n").filter((s) => s.startsWith("TITLE:")).length,
    ).toBe(1);
  });
});
describe("Editor and states", () => {
  it("updates the live preview and changes templates", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Editor />
      </MemoryRouter>,
    );
    const field = screen.getByLabelText("Full name");
    await user.clear(field);
    await user.type(field, "Morgan Lee");
    expect(
      screen.getByRole("heading", { name: "Morgan Lee" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Design" }));
    await user.click(screen.getByRole("button", { name: "editorial" }));
    expect(document.querySelector(".profile-card")).toHaveClass(
      "template-editorial",
    );
  });
  it("saves before publishing and uses the server-generated ID", async () => {
    mocks.post.mockReset();
    const record = {
      _id: "card123",
      slug: "test-user",
      draft: { ...sample, displayName: "Test User" },
      published: false,
    };
    mocks.post
      .mockResolvedValueOnce({ data: { data: record } })
      .mockResolvedValueOnce({
        data: { data: { ...record, published: true } },
      });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Editor />
      </MemoryRouter>,
    );
    await user.type(screen.getByLabelText(/Profile address/), "test-user");
    await user.click(screen.getByRole("button", { name: "Publish card" }));
    await waitFor(() =>
      expect(mocks.post).toHaveBeenCalledWith("/cards/card123/publish"),
    );
    expect(mocks.post.mock.calls[0][0]).toBe("/cards");
  });
  it("provides accessible loading and retry states", async () => {
    const retry = vi.fn();
    const { rerender } = render(<Loading />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    rerender(<ErrorState message="Network unavailable" retry={retry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Network unavailable");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
