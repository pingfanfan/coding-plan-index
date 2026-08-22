import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import YAML from "yaml";
import {
  ApisFileSchema,
  BenchmarksFileSchema,
  DecisionEstimatesFileSchema,
  ProductsFileSchema,
  OffersFileSchema,
  SourcesFileSchema,
  VideoProductsFileSchema,
} from "@/lib/schema";

function readYaml(file: string) {
  return YAML.parse(readFileSync(path.join(process.cwd(), "data", file), "utf8"));
}

export function getCatalog() {
  const products = ProductsFileSchema.parse(readYaml("products.yml"));
  const apis = ApisFileSchema.parse(readYaml("apis.yml"));
  const sources = SourcesFileSchema.parse(readYaml("sources.yml"));
  const benchmarks = BenchmarksFileSchema.parse(readYaml("benchmarks.yml"));
  const estimates = DecisionEstimatesFileSchema.parse(readYaml("decision-estimates.yml"));
  const video = VideoProductsFileSchema.parse(readYaml("video-products.yml"));
  const offers = OffersFileSchema.parse(readYaml("offers.yml"));
  return { ...products, ...apis, ...sources, ...benchmarks, ...estimates, ...video, ...offers };
}

export function getProduct(slug: string) {
  return getCatalog().products.find((item) => item.slug === slug);
}

export function getApiVendor(slug: string) {
  return getCatalog().apiVendors.find((item) => item.slug === slug);
}

export function getVideoProduct(slug: string) {
  return getCatalog().videoProducts.find((item) => item.slug === slug);
}

export function sourceMap() {
  return new Map(getCatalog().sources.map((source) => [source.id, source]));
}
