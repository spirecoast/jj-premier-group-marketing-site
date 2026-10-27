"use client";

import { MY_LIST_KEY } from "@/lib/encore/my-list";
import { createSlugListStore } from "@/lib/slug-list-store";

/**
 * The shows someone has saved, kept in this browser (lib/slug-list-store.ts):
 * one list that every Save button, count and list view reads.
 */
export const useMyList = createSlugListStore(MY_LIST_KEY);
