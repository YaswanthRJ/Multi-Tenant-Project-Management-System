import type { Request, Response } from "express";
import type {
    ProjectInput,
    ProjectStatus,
    ProjectUpdateInput
} from "../../types/project.js";
import {
    createProject,
    deleteProject,
    getProject,
    listProjects,
    updateProject
} from "./project.service.js";

const projectStatuses: ProjectStatus[] = ["ACTIVE", "INACTIVE", "DRAFT"];
const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseProjectInput(body: unknown): ProjectInput | null {
    if (!body || typeof body !== "object") {
        return null;
    }

    const value = body as Record<string, unknown>;

    if (
        typeof value.name !== "string" ||
        !value.name.trim() ||
        typeof value.address !== "string" ||
        !value.address.trim() ||
        typeof value.useCase !== "string" ||
        !value.useCase.trim() ||
        typeof value.status !== "string" ||
        !projectStatuses.includes(value.status as ProjectStatus)
    ) {
        return null;
    }

    return {
        name: value.name.trim(),
        address: value.address.trim(),
        useCase: value.useCase.trim(),
        status: value.status as ProjectStatus
    };
}

export async function list(req: Request, res: Response) {
    const projects = await listProjects(req.user!);
    return res.json(projects);
}

function parseProjectUpdateInput(body: unknown): ProjectUpdateInput | null {
    const input = parseProjectInput(body);

    if (!input || !body || typeof body !== "object") {
        return null;
    }

    const tenantId = (body as Record<string, unknown>).tenantId;

    return {
        ...input,
        tenantId: typeof tenantId === "string" ? tenantId : undefined
    };
}

export async function get(req: Request, res: Response) {
    const id = getProjectId(req, res);
    if (!id) {
        return;
    }
    const project = await getProject(req.user!, id);
    if (!project) {
        return res.status(404).json({ message: "Project not found" });
    }
    return res.json(project);
}

export async function create(req: Request, res: Response) {
    const input = parseProjectInput(req.body);

    if (!input) {
        return res.status(400).json({
            message: "name, address, useCase, and a valid status are required"
        });
    }

    const project = await createProject(req.user!, {
        ...input,
        tenantId: req.body.tenantId
    });

    return res.status(201).json(project);
}

export async function update(req: Request, res: Response) {
    const id = getProjectId(req, res);

    if (!id) {
        return;
    }

    const input = parseProjectUpdateInput(req.body);

    if (!input) {
        return res.status(400).json({
            message: "name, address, useCase, and a valid status are required"
        });
    }

    const project = await updateProject(req.user!, id, input);

    if (!project) {
        return res.status(404).json({ message: "Project not found" });
    }

    return res.json(project);
}

export async function remove(req: Request, res: Response) {
    const id = getProjectId(req, res);

    if (!id) {
        return;
    }

    const deleted = await deleteProject(req.user!, id);

    if (!deleted) {
        return res.status(404).json({ message: "Project not found" });
    }

    return res.status(204).send();
}

function getProjectId(req: Request, res: Response): string | null {
    const id = req.params.id;
    if (typeof id !== "string" || !uuidPattern.test(id)) {
        res.status(400).json({ message: "Invalid project ID" });
        return null;
    }
    return id;
}