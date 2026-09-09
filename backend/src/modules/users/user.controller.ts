import type { Request, Response } from "express";
import type { RoleName } from "../../types/auth.js";
import type {
    UserInput,
    UserUpdateInput
} from "../../types/user.js";
import {
    createUser,
    disableUser,
    listUsers,
    updateUser
} from "./user.service.js";

const userRoles: Exclude<RoleName, "SUPER_ADMIN">[] = [
    "ADMIN",
    "AGENT"
];

function getUserId(req: Request, res: Response): string | null {
    const id = req.params.id;

    if (typeof id !== "string") {
        res.status(400).json({
            message: "User ID is required"
        });
        return null;
    }

    return id;
}

function parseUserInput(
    body: unknown,
    passwordRequired = false
): UserInput | null {
    if (!body || typeof body !== "object") {
        return null;
    }

    const value = body as Record<string, unknown>;

    if (
        typeof value.name !== "string" ||
        !value.name.trim() ||
        typeof value.email !== "string" ||
        !value.email.trim() ||
        typeof value.role !== "string" ||
        !userRoles.includes(value.role as Exclude<RoleName, "SUPER_ADMIN">)
    ) {
        return null;
    }

    if (
        passwordRequired &&
        (typeof value.password !== "string" || !value.password)
    ) {
        return null;
    }

    if (
        !passwordRequired &&
        value.password !== undefined &&
        (typeof value.password !== "string" || !value.password)
    ) {
        return null;
    }

    return {
        name: value.name.trim(),
        email: value.email.trim(),
        password: value.password as string | undefined,
        role: value.role as Exclude<RoleName, "SUPER_ADMIN">,
        tenantId: typeof value.tenantId === "string"
            ? value.tenantId
            : undefined
    };
}

function parseUserUpdateInput(body: unknown): UserUpdateInput | null {
    if (!body || typeof body !== "object") {
        return null;
    }

    const value = body as Record<string, unknown>;

    if ("tenantId" in value) {
        if (typeof value.tenantId !== "string" || !value.tenantId.trim()) {
            return null;
        }
    }

    const input: UserUpdateInput = {};

    if (value.name !== undefined) {
        if (typeof value.name !== "string" || !value.name.trim()) {
            return null;
        }

        input.name = value.name.trim();
    }

    if (value.email !== undefined) {
        if (typeof value.email !== "string" || !value.email.trim()) {
            return null;
        }

        input.email = value.email.trim();
    }

    if (value.role !== undefined) {
        if (
            typeof value.role !== "string" ||
            !userRoles.includes(value.role as Exclude<RoleName, "SUPER_ADMIN">)
        ) {
            return null;
        }

        input.role = value.role as Exclude<RoleName, "SUPER_ADMIN">;
    }

    if (value.password !== undefined) {
        if (typeof value.password !== "string" || !value.password) {
            return null;
        }

        input.password = value.password;
    }

    if (value.tenantId !== undefined) {
        input.tenantId = value.tenantId as string;
    }

    return Object.keys(input).length > 0 ? input : null;
}

export async function list(req: Request, res: Response) {
    return res.json(await listUsers(req.user!));
}

export async function create(req: Request, res: Response) {
    const input = parseUserInput(req.body, true);

    if (!input) {
        return res.status(400).json({
            message: "name, email, password, and a valid role are required"
        });
    }

    if (req.user!.tenantId === null && !input.tenantId) {
        return res.status(400).json({
            message: "tenantId is required for Super Admin user creation"
        });
    }

    try {
        return res.status(201).json(
            await createUser(req.user!, input)
        );
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            return res.status(403).json({ message: "Forbidden" });
        }

        throw error;
    }
}

export async function update(req: Request, res: Response) {
    const input = parseUserUpdateInput(req.body);
    const id = getUserId(req, res);

    if (!input || !id) {
        if (!id) {
            return;
        }

        return res.status(400).json({
            message: "At least one valid user field is required"
        });
    }

    let user;

    try {
        user = await updateUser(req.user!, id, input);
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            return res.status(403).json({ message: "Forbidden" });
        }

        throw error;
    }

    if (!user) {
        return res.status(404).json({
            message: "User not found"
        });
    }

    return res.json(user);
}

export async function disable(req: Request, res: Response) {
    const { disabled } = req.body;
    const id = getUserId(req, res);

    if (!id) {
        return;
    }

    if (typeof disabled !== "boolean") {
        return res.status(400).json({
            message: "disabled must be a boolean"
        });
    }

    let user;

    try {
        user = await disableUser(req.user!, id, disabled);
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            return res.status(403).json({ message: "Forbidden" });
        }

        throw error;
    }

    if (!user) {
        return res.status(404).json({
            message: "User not found"
        });
    }

    return res.json(user);
}
