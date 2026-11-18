export type SecretFinding = { check: string; why: string; file: string; line: number; text: string };
export declare function findSecrets(root?: string): SecretFinding[];
