"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface AgentProductDetailProps {
  product: Product;
}

export function AgentProductDetail({ product }: AgentProductDetailProps) {
  return (
    <Card className="my-3 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          {product.images?.[0] && (
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border bg-muted">
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight">
              {product.name}
            </CardTitle>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xl font-bold">
                {formatPrice(product.price, product.currency)}
              </span>
              {product.category && (
                <Badge variant="outline" className="text-xs">
                  {product.category}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {product.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {product.description}
          </p>
        )}
        <Link
          href={`/products/${product.slug || product.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          View full details
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}
