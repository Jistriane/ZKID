import { useMemo } from 'react'
import { useWallet } from '../context/WalletContext'
import { createClients } from '../services/contracts'

export function useContracts() {
  const { network } = useWallet()
  const clients = useMemo(() => createClients(network), [network])
  return clients
}
