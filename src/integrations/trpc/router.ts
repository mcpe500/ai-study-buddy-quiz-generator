import { createTRPCRouter } from './init'
import { authRouter } from './auth'
import { studyRouter } from './study'

export const trpcRouter = createTRPCRouter({
  auth: authRouter,
  study: studyRouter,
})

export type TRPCRouter = typeof trpcRouter
