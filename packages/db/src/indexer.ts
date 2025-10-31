// /packages/db/src/indexer.ts
import { prisma } from './prisma'
import type { Prisma, ReactionValue, LedgerEntryType, DeliveryType, PaymentMethod } from '@prisma/client'

/**
 * Keyset pagination for products (public feed).
 * Sorts by createdAt DESC, then id DESC for stable ordering.
 */
export async function getProductFeed(opts: {
  limit?: number
  cursor?: { createdAt: Date; id: string } | null
  shopId?: string
  categoryId?: string
}) {
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 100)

  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    ...(opts.shopId ? { shopId: opts.shopId } : {}),
    ...(opts.categoryId ? { categoryId: opts.categoryId } : {}),
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput[] = [{ createdAt: 'desc' }, { id: 'desc' }]

  const results = await prisma.product.findMany({
    where,
    orderBy,
    take: limit + 1,
    ...(opts.cursor
      ? { cursor: { id: opts.cursor.id }, skip: 1 } // anchor by id, orderBy keeps stability
      : {}),
    select: {
      id: true,
      name: true,
      priceDA: true,
      imageUrl: true,
      likesCount: true,
      dislikesCount: true,
      createdAt: true,
      shopId: true,
      categoryId: true,
    },
  })

  const hasMore = results.length > limit
  const page = hasMore ? results.slice(0, -1) : results
  const nextCursor = hasMore
    ? { id: page[page.length - 1].id, createdAt: page[page.length - 1].createdAt }
    : null

  return { items: page, nextCursor }
}

/**
 * Toggle/set a reaction (LIKE/DISLIKE) atomically.
 * - Idempotent if user repeats the same reaction.
 * - Safely adjusts counters.
 */
export async function setProductReaction(opts: {
  userId: string
  productId: string
  value: ReactionValue // 'LIKE' | 'DISLIKE'
}) {
  return prisma.$transaction(async (tx) => {
    const prev = await tx.productReaction.findUnique({
      where: { productId_userId: { productId: opts.productId, userId: opts.userId } },
      select: { value: true },
    })

    // Nothing to do
    if (prev?.value === opts.value) {
      return { changed: false }
    }

    // Upsert reaction
    await tx.productReaction.upsert({
      where: { productId_userId: { productId: opts.productId, userId: opts.userId } },
      create: { productId: opts.productId, userId: opts.userId, value: opts.value },
      update: { value: opts.value },
    })

    // Update counters
    const updates: Prisma.ProductUpdateArgs['data'] = {}
    if (!prev) {
      // new reaction
      if (opts.value === 'LIKE') updates.likesCount = { increment: 1 }
      else updates.dislikesCount = { increment: 1 }
    } else {
      // changed reaction
      if (opts.value === 'LIKE') {
        updates.likesCount = { increment: 1 }
        updates.dislikesCount = { decrement: 1 }
      } else {
        updates.dislikesCount = { increment: 1 }
        updates.likesCount = { decrement: 1 }
      }
    }

    await tx.product.update({
      where: { id: opts.productId },
      data: updates,
      select: { id: true }, // minimal
    })

    return { changed: true }
  })
}

/**
 * Create an order and append a ledger entry for SALE_NET in a single transaction.
 * - Computes commission from PlatformConfig (id=1).
 * - Snapshots provided price/shipping values (caller must pass current values).
 * - Does NOT change product stock (you can add that later if needed).
 */
export async function createOrderWithLedger(opts: {
  productId: string
  shopId: string
  clientId: string
  quantity?: number
  productNameAtOrder: string
  productPriceDAAtOrder: number
  shippingPriceDAAtOrder: number
  deliveryType: DeliveryType
  destinationWilayaId: number
  address?: { baladiya?: string; street?: string; exactLocation?: string; pickupCity?: string }
  paymentMethod?: PaymentMethod
  paymentProofUrl: string
  visibleDays?: { client?: number; shop?: number } // defaults: 90d each
}) {
  return prisma.$transaction(async (tx) => {
    const cfg = await tx.platformConfig.findUnique({ where: { id: 1 } })
    const commissionBps = cfg?.commissionRateBps ?? 0

    const quantity = Math.max(opts.quantity ?? 1, 1)
    const gross = opts.productPriceDAAtOrder * quantity
    const commission = Math.floor((gross * commissionBps) / 10_000)
    const netToShop = gross - commission

    const now = new Date()
    const clientUntil = new Date(now.getTime() + (opts.visibleDays?.client ?? 90) * 24 * 60 * 60 * 1000)
    const shopUntil   = new Date(now.getTime() + (opts.visibleDays?.shop ?? 90) * 24 * 60 * 60 * 1000)

    const order = await tx.order.create({
      data: {
        productId: opts.productId,
        shopId: opts.shopId,
        clientId: opts.clientId,
        quantity,

        productNameAtOrder: opts.productNameAtOrder,
        productPriceDAAtOrder: opts.productPriceDAAtOrder,
        shippingPriceDAAtOrder: opts.shippingPriceDAAtOrder,

        deliveryType: opts.deliveryType,
        destinationWilayaId: opts.destinationWilayaId,
        baladiya: opts.address?.baladiya,
        street: opts.address?.street,
        exactLocation: opts.address?.exactLocation,
        pickupCity: opts.address?.pickupCity,

        paymentMethod: opts.paymentMethod ?? 'BARIDI_MOB',
        paymentProofUrl: opts.paymentProofUrl,
        paidAmountDA: gross, // your current rule

        clientVisibleUntil: clientUntil,
        shopVisibleUntil: shopUntil,
      },
      select: { id: true, shopId: true },
    })

    await tx.shopLedgerEntry.create({
      data: {
        shopId: order.shopId,
        orderId: order.id,
        type: 'SALE_NET' as LedgerEntryType,
        amountDA: netToShop,
      },
    })

    return { orderId: order.id, netToShop, commission }
  })
}

export { prisma }
export type {
  Prisma
}
