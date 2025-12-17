/**
 * Invoice Print Layout
 * @see spec.md §7.4 Print Layout (列印專用版面)
 *
 * Dedicated PDF layout component using @react-pdf/renderer.
 * This layout is used ONLY for generating PDFs, NOT for live preview.
 *
 * Requirements:
 * - Define exact paper size (A4)
 * - Control margins, spacing, and pagination
 * - Contain ONLY document content (no UI controls)
 * - Include system-defined headers/footers
 */

import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
} from '@react-pdf/renderer';

import type { PrintSnapshot } from './print-types';

interface InvoicePrintLayoutProps {
    snapshot: PrintSnapshot;
}

// PDF styles using @react-pdf/renderer StyleSheet
const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 10,
        paddingTop: 40,
        paddingBottom: 60,
        paddingHorizontal: 40,
        backgroundColor: '#ffffff',
    },
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    companyInfo: {
        flex: 1,
    },
    companyName: {
        fontSize: 16,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 4,
        color: '#1a365d',
    },
    companyDetail: {
        fontSize: 9,
        color: '#4a5568',
        marginBottom: 2,
    },
    invoiceTitle: {
        textAlign: 'right',
    },
    invoiceTitleText: {
        fontSize: 24,
        fontFamily: 'Helvetica-Bold',
        color: '#1a365d',
        marginBottom: 8,
    },
    invoiceNumber: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        color: '#3182ce',
        marginBottom: 12,
    },
    invoiceDateLabel: {
        fontSize: 9,
        color: '#718096',
    },
    invoiceDateValue: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 4,
    },

    // Divider
    divider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 20,
    },

    // Bill To
    billToSection: {
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: '#718096',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    customerName: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        color: '#1a202c',
        marginBottom: 4,
    },
    customerDetail: {
        fontSize: 9,
        color: '#4a5568',
        marginBottom: 2,
    },

    // Table
    table: {
        marginBottom: 24,
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 2,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 8,
        marginBottom: 4,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f7fafc',
    },
    tableRowAlt: {
        backgroundColor: '#f7fafc',
    },
    colDescription: {
        flex: 3,
    },
    colQty: {
        width: 50,
        textAlign: 'center',
    },
    colPrice: {
        width: 70,
        textAlign: 'right',
    },
    colTax: {
        width: 50,
        textAlign: 'right',
    },
    colAmount: {
        width: 80,
        textAlign: 'right',
    },
    tableHeaderText: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: '#4a5568',
    },
    tableCellText: {
        fontSize: 9,
        color: '#1a202c',
    },
    tableCellBold: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: '#1a202c',
    },
    tableCellMuted: {
        fontSize: 8,
        color: '#718096',
    },

    // Totals
    totalsSection: {
        alignItems: 'flex-end',
        marginBottom: 24,
    },
    totalsBox: {
        width: 200,
    },
    totalsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    totalsLabel: {
        fontSize: 9,
        color: '#718096',
    },
    totalsValue: {
        fontSize: 9,
        color: '#1a202c',
    },
    totalsDivider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 4,
    },
    totalsFinalLabel: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: '#1a202c',
    },
    totalsFinalValue: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: '#3182ce',
    },
    discountValue: {
        fontSize: 9,
        color: '#38a169',
    },

    // Notes & Terms
    notesSection: {
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 16,
        marginTop: 16,
    },
    notesBlock: {
        marginBottom: 12,
    },
    notesText: {
        fontSize: 9,
        color: '#4a5568',
        lineHeight: 1.4,
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 12,
    },
    footerText: {
        fontSize: 9,
        color: '#718096',
    },
    footerWebsite: {
        fontSize: 8,
        color: '#a0aec0',
        marginTop: 4,
    },
});

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/**
 * Format currency value
 */
function formatCurrency(value: number): string {
    return `$${value.toFixed(2)}`;
}

/**
 * Invoice PDF Print Layout Component
 */
export function InvoicePrintLayout({ snapshot }: InvoicePrintLayoutProps) {
    const { companyInfo, settings } = snapshot;

    return (
        <Document>
            <Page
                size={settings.paperSize}
                orientation={settings.orientation}
                style={styles.page}
            >
                {/* Header */}
                <View style={styles.header}>
                    {/* Company Info */}
                    <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>{companyInfo.name}</Text>
                        <Text style={styles.companyDetail}>{companyInfo.address}</Text>
                        <Text style={styles.companyDetail}>{companyInfo.phone}</Text>
                        <Text style={styles.companyDetail}>{companyInfo.email}</Text>
                        {companyInfo.taxId && (
                            <Text style={styles.companyDetail}>Tax ID: {companyInfo.taxId}</Text>
                        )}
                    </View>

                    {/* Invoice Title & Details */}
                    <View style={styles.invoiceTitle}>
                        <Text style={styles.invoiceTitleText}>INVOICE</Text>
                        <Text style={styles.invoiceNumber}>{snapshot.invoiceNumber}</Text>
                        <Text style={styles.invoiceDateLabel}>Invoice Date:</Text>
                        <Text style={styles.invoiceDateValue}>{formatDate(snapshot.invoiceDate)}</Text>
                        <Text style={styles.invoiceDateLabel}>Due Date:</Text>
                        <Text style={styles.invoiceDateValue}>{formatDate(snapshot.dueDate)}</Text>
                    </View>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Bill To */}
                <View style={styles.billToSection}>
                    <Text style={styles.sectionLabel}>Bill To</Text>
                    <Text style={styles.customerName}>{snapshot.customerName || 'No customer selected'}</Text>
                    {snapshot.customerEmail && (
                        <Text style={styles.customerDetail}>{snapshot.customerEmail}</Text>
                    )}
                    {snapshot.customerAddress && (
                        <Text style={styles.customerDetail}>{snapshot.customerAddress}</Text>
                    )}
                </View>

                {/* Items Table */}
                <View style={styles.table}>
                    {/* Table Header */}
                    <View style={styles.tableHeader}>
                        <View style={styles.colDescription}>
                            <Text style={styles.tableHeaderText}>Description</Text>
                        </View>
                        <View style={styles.colQty}>
                            <Text style={styles.tableHeaderText}>Qty</Text>
                        </View>
                        <View style={styles.colPrice}>
                            <Text style={styles.tableHeaderText}>Unit Price</Text>
                        </View>
                        <View style={styles.colTax}>
                            <Text style={styles.tableHeaderText}>Tax</Text>
                        </View>
                        <View style={styles.colAmount}>
                            <Text style={styles.tableHeaderText}>Amount</Text>
                        </View>
                    </View>

                    {/* Table Rows */}
                    {snapshot.items.length > 0 ? (
                        snapshot.items.map((item, index) => (
                            <View
                                key={item.id}
                                style={index % 2 === 0 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}
                            >
                                <View style={styles.colDescription}>
                                    <Text style={styles.tableCellBold}>
                                        {item.productName || 'Unnamed Product'}
                                    </Text>
                                    <Text style={styles.tableCellMuted}>{item.sku}</Text>
                                </View>
                                <View style={styles.colQty}>
                                    <Text style={styles.tableCellText}>{item.quantity}</Text>
                                </View>
                                <View style={styles.colPrice}>
                                    <Text style={styles.tableCellText}>
                                        {formatCurrency(item.unitPrice)}
                                    </Text>
                                </View>
                                <View style={styles.colTax}>
                                    <Text style={styles.tableCellMuted}>
                                        {item.taxRate > 0 ? `${item.taxRate}%` : '-'}
                                    </Text>
                                </View>
                                <View style={styles.colAmount}>
                                    <Text style={styles.tableCellBold}>
                                        {formatCurrency(item.total)}
                                    </Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.tableRow}>
                            <Text style={styles.tableCellMuted}>No items in this invoice</Text>
                        </View>
                    )}
                </View>

                {/* Totals */}
                <View style={styles.totalsSection}>
                    <View style={styles.totalsBox}>
                        <View style={styles.totalsRow}>
                            <Text style={styles.totalsLabel}>Subtotal</Text>
                            <Text style={styles.totalsValue}>{formatCurrency(snapshot.subtotal)}</Text>
                        </View>
                        {snapshot.discount > 0 && (
                            <View style={styles.totalsRow}>
                                <Text style={styles.totalsLabel}>Discount</Text>
                                <Text style={styles.discountValue}>
                                    -{formatCurrency(snapshot.discount)}
                                </Text>
                            </View>
                        )}
                        <View style={styles.totalsRow}>
                            <Text style={styles.totalsLabel}>Tax</Text>
                            <Text style={styles.totalsValue}>{formatCurrency(snapshot.taxAmount)}</Text>
                        </View>
                        <View style={styles.totalsDivider} />
                        <View style={styles.totalsRow}>
                            <Text style={styles.totalsFinalLabel}>Total</Text>
                            <Text style={styles.totalsFinalValue}>{formatCurrency(snapshot.total)}</Text>
                        </View>
                    </View>
                </View>

                {/* Notes & Terms */}
                {(snapshot.notes || snapshot.terms) && (
                    <View style={styles.notesSection}>
                        {snapshot.notes && (
                            <View style={styles.notesBlock}>
                                <Text style={styles.sectionLabel}>Notes</Text>
                                <Text style={styles.notesText}>{snapshot.notes}</Text>
                            </View>
                        )}
                        {snapshot.terms && (
                            <View style={styles.notesBlock}>
                                <Text style={styles.sectionLabel}>Terms & Conditions</Text>
                                <Text style={styles.notesText}>{snapshot.terms}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>Thank you for your business!</Text>
                    {companyInfo.website && (
                        <Text style={styles.footerWebsite}>{companyInfo.website}</Text>
                    )}
                </View>
            </Page>
        </Document>
    );
}
