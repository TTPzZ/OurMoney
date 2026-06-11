export interface Transaction {
  from: string;
  to: string;
  amount: number;
}

export interface Split {
  userId: string;
  amount: number;
}

export interface Bill {
  paidBy: string;
  totalAmount: number;
  splits: Split[];
}

export interface CompletedSettlement {
  from: string;
  to: string;
  amount: number;
}

/**
 * Minimum Cash Flow Algorithm (Greedy Approach)
 * Calculates the most efficient way to settle debts within a group.
 */
export function simplifyDebts(
  bills: Bill[], 
  memberIds: string[], 
  completedSettlements: CompletedSettlement[] = []
): Transaction[] {
  const balances: Record<string, number> = {};
  
  // Initialize balances
  memberIds.forEach(id => balances[id] = 0);

  // Calculate net balance for each member from bills
  bills.forEach(bill => {
    const payer = bill.paidBy.toString();
    if (balances[payer] !== undefined) {
      balances[payer] += bill.totalAmount;
    }

    bill.splits.forEach(split => {
      const debtor = split.userId.toString();
      if (balances[debtor] !== undefined) {
        balances[debtor] -= split.amount;
      }
    });
  });

  // Adjust balances with completed settlements
  completedSettlements.forEach(s => {
    const from = s.from.toString();
    const to = s.to.toString();
    if (balances[from] !== undefined) balances[from] += s.amount;
    if (balances[to] !== undefined) balances[to] -= s.amount;
  });

  // Separate members into net debtors and net creditors
  const credit: { id: string; amount: number }[] = [];
  const debit: { id: string; amount: number }[] = [];

  Object.entries(balances).forEach(([id, balance]) => {
    // Use a small epsilon to handle floating point precision
    if (balance > 0.01) {
      credit.push({ id, amount: balance });
    } else if (balance < -0.01) {
      debit.push({ id, amount: -balance });
    }
  });

  const transactions: Transaction[] = [];

  // Sort by amount to optimize the greedy approach
  credit.sort((a, b) => b.amount - a.amount);
  debit.sort((a, b) => b.amount - a.amount);

  let i = 0; // creditor index
  let j = 0; // debtor index

  while (i < credit.length && j < debit.length) {
    const creditor = credit[i];
    const debtor = debit[j];
    
    const settleAmount = Math.min(creditor.amount, debtor.amount);
    
    if (settleAmount > 0.01) {
      transactions.push({
        from: debtor.id,
        to: creditor.id,
        amount: Math.round(settleAmount * 100) / 100 // Round to 2 decimals
      });
    }

    creditor.amount -= settleAmount;
    debtor.amount -= settleAmount;

    if (creditor.amount < 0.01) i++;
    if (debtor.amount < 0.01) j++;
  }

  return transactions;
}
