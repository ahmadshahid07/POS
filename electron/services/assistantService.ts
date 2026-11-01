import { DBManager } from '../db/connection';
import { AssistantAnswer } from '../../src/types';

interface KnowledgeItem {
  keywords: string[];
  intent: string;
  answer: string;
  actionRoute?: string;
  dynamicHandler?: () => { text: string; data?: any };
}

export class AssistantService {
  private static knowledgeBase: KnowledgeItem[] = [
    {
      intent: 'low_stock_query',
      keywords: ['low stock', 'stock alert', 'running low', 'low in stock', 'shortage'],
      answer: '',
      actionRoute: 'products',
      dynamicHandler: () => {
        const db = DBManager.getDb();
        const items = db.prepare(`
          SELECT name, sku, current_stock, min_stock_threshold 
          FROM products 
          WHERE status = 'active' AND current_stock <= min_stock_threshold 
          ORDER BY current_stock ASC 
          LIMIT 8
        `).all();

        if (items.length === 0) {
          return { text: 'All active products are currently well-stocked above their minimum thresholds.' };
        }

        const summary = items.map((i: any) => `• ${i.name} (${i.sku}): ${i.current_stock} remaining (Alert at: ${i.min_stock_threshold})`).join('\n');
        return {
          text: `You have ${items.length} product(s) at or below minimum stock threshold:\n\n${summary}\n\nYou can reorder stock under the Purchases menu.`,
          data: items
        };
      }
    },
    {
      intent: 'today_sales_query',
      keywords: ['today sales', 'sales today', 'today revenue', 'sales made today', 'collection today'],
      answer: '',
      actionRoute: 'dashboard',
      dynamicHandler: () => {
        const db = DBManager.getDb();
        const today = new Date().toISOString().split('T')[0];
        const res = db.prepare(`
          SELECT 
            COUNT(*) as count,
            COALESCE(SUM(grand_total), 0) as total,
            COALESCE(SUM(paid_amount), 0) as paid
          FROM sales 
          WHERE status != 'voided' AND date(sale_date) = date(?)
        `).get(today);

        return {
          text: `Today's Business Summary (${today}):\n• Invoices Completed: ${res.count}\n• Total Sales Volume: ₨ ${res.total.toLocaleString()}\n• Cash/Payments Settled: ₨ ${res.paid.toLocaleString()}`,
          data: res
        };
      }
    },
    {
      intent: 'out_of_stock_query',
      keywords: ['out of stock', 'zero stock', 'empty stock', 'finished items'],
      answer: '',
      actionRoute: 'products',
      dynamicHandler: () => {
        const db = DBManager.getDb();
        const items = db.prepare(`
          SELECT name, sku 
          FROM products 
          WHERE status = 'active' AND current_stock <= 0 
          LIMIT 10
        `).all();

        if (items.length === 0) {
          return { text: 'There are currently no active products with zero stock.' };
        }

        const list = items.map((i: any) => `• ${i.name} (SKU: ${i.sku})`).join('\n');
        return {
          text: `The following active items are completely out of stock:\n\n${list}\n\nGo to 'Purchases' to create a purchase order from your supplier.`,
          data: items
        };
      }
    },
    {
      intent: 'how_to_add_product',
      keywords: ['add product', 'add a product', 'new product', 'create product', 'create a product', 'new item', 'register product', 'add item'],
      actionRoute: 'products',
      answer: `To add a new product in SKYTHS:
1. Open 'Products & Inventory' from the left sidebar.
2. Click the '+ Add Product' button in the top right.
3. Fill in the Product Name, SKU (or click Auto-SKU), Barcode, Category, Cost Price, and Selling Price.
4. Set an initial Opening Stock and Minimum Stock Threshold for low-stock alerts.
5. Click 'Save Product'.
The item will be immediately available in POS for scanning and billing.`
    },
    {
      intent: 'how_to_process_sale',
      keywords: ['process sale', 'how to sell', 'pos billing', 'make a sale', 'checkout', 'create invoice'],
      actionRoute: 'pos',
      answer: `To process a sale in POS:
1. Open 'Point of Sale' from the sidebar (or press F2).
2. Scan the barcode with your USB barcode scanner, or search by product name/SKU in the search box.
3. Click or scan the item to add it to the cart. Adjust quantities with '+' or '-'.
4. Select a customer or leave as 'Walk-in Customer'.
5. Choose payment method: Cash, Card, Bank, Easypaisa, JazzCash, or COD.
6. Enter Amount Tendered and click 'Complete Sale' (or press Enter).
7. The invoice will be recorded, stock deducted, and receipt generated.`
    },
    {
      intent: 'how_to_reprint_invoice',
      keywords: ['reprint invoice', 'reprint receipt', 'duplicate receipt', 'find old invoice', 'old bill'],
      actionRoute: 'sales',
      answer: `To reprint an old invoice or receipt:
1. Open 'Sales History' from the sidebar.
2. Search by invoice number (e.g. INV-1001) or customer name.
3. Click the 'View / Reprint' icon on the transaction row.
4. In the invoice dialog, select 'Print Receipt (58mm/80mm)' or 'Print A4 Invoice'.
Note: A reprint will never create duplicate entries or alter stock.`
    },
    {
      intent: 'how_to_handle_returns',
      keywords: ['return item', 'customer return', 'refund sale', 'exchange product', 'return goods'],
      actionRoute: 'returns',
      answer: `To process a customer return in SKYTHS:
1. Go to 'Sales Returns' from the sidebar (or locate the sale in Sales History and click 'Return').
2. Select the Invoice Number being returned.
3. Choose the items and quantities returned.
4. Select Restock Action:
   • 'Restock' (returns item back to sellable inventory)
   • 'Damaged / Scrap' (does NOT add back to sellable stock)
5. Select Refund Method (Cash, Original Payment, or Account Credit).
6. Click 'Process Return'. The system will generate a Return Receipt and update accounting records.`
    },
    {
      intent: 'how_to_record_expense',
      keywords: ['add expense', 'record expense', 'shop expense', 'pay rent', 'utility bill', 'operating expense'],
      actionRoute: 'expenses',
      answer: `To record a business expense:
1. Open 'Expenses' from the sidebar.
2. Click '+ Add Expense'.
3. Select an Expense Category (e.g. Rent, Electricity, Salaries, Packaging).
4. Enter Amount, Payment Method (Cash/Bank), Payee, and notes.
5. Click 'Save Expense'.
If paid by Cash, this will automatically deduct from your active cash drawer session and update your Net Profit calculation.`
    },
    {
      intent: 'how_profit_is_calculated',
      keywords: ['profit calculation', 'how is profit calculated', 'gross profit', 'net profit', 'cogs formula'],
      actionRoute: 'reports',
      answer: `SKYTHS uses standard accrual & inventory accounting principles:
• Net Sales = Gross Sales - Order Discounts - Sales Returns
• Cost of Goods Sold (COGS) = Sum of (Sold Quantity × Historical Unit Cost snapshot)
• Gross Profit = Net Sales - COGS
• Net Operating Profit = Gross Profit - Operating Expenses

Because historical cost snapshots are preserved on every sale item, supplier price changes today will never alter yesterday's past profit figures.`
    },
    {
      intent: 'how_to_backup_restore',
      keywords: ['backup database', 'create backup', 'restore database', 'recover data', 'save copy'],
      actionRoute: 'backup',
      answer: `To create or restore a backup:
1. Open 'Database & Backups' from the sidebar.
2. Click 'Create Immediate Backup' to produce a verified SQLite database snapshot in your chosen backup directory.
3. To restore: Click 'Restore from Backup', select a verified .db backup file, review the safety prompt, and confirm.
SKYTHS automatically takes a safety backup before restoring to prevent accidental data loss.`
    },
    {
      intent: 'cash_management',
      keywords: ['cash drawer', 'cash session', 'day end cash', 'reconciliation', 'cash difference'],
      actionRoute: 'cash',
      answer: `To manage daily cash:
1. Go to 'Cash Management' at the start of your shift.
2. Enter your Opening Cash balance and click 'Open Drawer Session'.
3. Throughout the day, cash sales, cash refunds, and cash expenses are tracked automatically.
4. At end of shift, enter your 'Actual Counted Cash'.
5. SKYTHS calculates any difference (overage/shortage) transparently and generates an End-of-Day reconciliation report.`
    }
  ];

  static query(userQuestion: string): AssistantAnswer {
    const q = userQuestion.toLowerCase().trim();

    // Check dynamic handlers first (live DB metrics)
    for (const item of this.knowledgeBase) {
      if (item.dynamicHandler) {
        for (const kw of item.keywords) {
          if (q.includes(kw)) {
            const result = item.dynamicHandler();
            return {
              reply: result.text,
              actionRoute: item.actionRoute,
              suggestions: ['Today sales', 'Low stock products', 'How to add a product', 'How to backup database']
            };
          }
        }
      }
    }

    // Check static knowledge items
    let bestMatch: KnowledgeItem | null = null;
    let highestScore = 0;

    for (const item of this.knowledgeBase) {
      let score = 0;
      for (const kw of item.keywords) {
        if (q.includes(kw)) {
          score += kw.length;
        }
      }
      if (score > highestScore) {
        highestScore = score;
        bestMatch = item;
      }
    }

    if (bestMatch && highestScore > 0) {
      return {
        reply: bestMatch.answer,
        actionRoute: bestMatch.actionRoute,
        suggestions: ['How to process a sale', 'How to reprint invoice', 'How is profit calculated', 'Create a backup']
      };
    }

    // Default polite guidance if no direct keyword matched
    return {
      reply: `I can help you navigate and operate SKYTHS! Here are topics you can ask me about:
• "How do I add a product?"
• "How do I process a sale in POS?"
• "How many products are low in stock?"
• "What was today's sales?"
• "How do I reprint an invoice?"
• "How do I record an expense?"
• "How to backup and restore the database?"
• "How is profit calculated?"

Feel free to ask any question or click a suggestion below.`,
      suggestions: ['Today sales', 'Low stock', 'How to process a sale', 'Create a backup', 'Profit calculation']
    };
  }
}
