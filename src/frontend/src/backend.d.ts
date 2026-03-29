import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface FormSubmission {
    name: string;
    email: string;
    message: string;
    timestamp: Time;
}
export type Time = bigint;
export interface backendInterface {
    getAllSubmissionsSortedByTimestamp(): Promise<Array<FormSubmission>>;
    submitContactForm(name: string, email: string, message: string): Promise<void>;
}
