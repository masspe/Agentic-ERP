import { Fragment, useMemo, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Copy, Zap, CheckCircle2, AlertCircle, Loader2, ChevronRight, Clock } from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const createInlineRenderer = () => {
    const tokenRegex = /(!?\[[^\]]*\]\([^\)]+\)|`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|https?:\/\/[^\s]+)(?![^<]*>)/g;

    const renderInline = (text, keyPrefix = 'inline') => {
        if (!text) return null;

        tokenRegex.lastIndex = 0;

        const segments = [];
        let lastIndex = 0;
        let match;
        let keyCounter = 0;

        const pushText = (value) => {
            if (!value) return;
            segments.push(<Fragment key={`${keyPrefix}-text-${keyCounter++}`}>{value}</Fragment>);
        };

        while ((match = tokenRegex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                pushText(text.slice(lastIndex, match.index));
            }

            const token = match[0];

            if (token.startsWith('`')) {
                segments.push(
                    <code
                        key={`${keyPrefix}-code-${keyCounter++}`}
                        className="px-1 py-0.5 rounded bg-slate-100 text-slate-700 text-xs"
                    >
                        {token.slice(1, -1)}
                    </code>
                );
            } else if (token.startsWith('![')) {
                const imageMatch = /!\[([^\]]*)\]\(([^\)]+)\)/.exec(token);
                if (imageMatch) {
                    const [, alt, url] = imageMatch;
                    segments.push(
                        <img
                            key={`${keyPrefix}-img-${keyCounter++}`}
                            src={url}
                            alt={alt}
                            className="max-w-full rounded-md border border-slate-200"
                        />
                    );
                }
            } else if (token.startsWith('[')) {
                const linkMatch = /\[([^\]]+)\]\(([^\)]+)\)/.exec(token);
                if (linkMatch) {
                    const [, label, url] = linkMatch;
                    segments.push(
                        <a
                            key={`${keyPrefix}-link-${keyCounter++}`}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-700 underline"
                        >
                            {label}
                        </a>
                    );
                }
            } else if (token.startsWith('**') || token.startsWith('__')) {
                segments.push(
                    <strong key={`${keyPrefix}-strong-${keyCounter++}`} className="font-semibold">
                        {token.slice(2, -2)}
                    </strong>
                );
            } else if (token.startsWith('*') || token.startsWith('_')) {
                segments.push(
                    <em key={`${keyPrefix}-em-${keyCounter++}`} className="italic">
                        {token.slice(1, -1)}
                    </em>
                );
            } else if (token.startsWith('http')) {
                segments.push(
                    <a
                        key={`${keyPrefix}-url-${keyCounter++}`}
                        href={token}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-700 underline"
                    >
                        {token}
                    </a>
                );
            } else {
                pushText(token);
            }

            lastIndex = tokenRegex.lastIndex;
        }

        if (lastIndex < text.length) {
            pushText(text.slice(lastIndex));
        }

        return segments;
    };

    return renderInline;
};

const MarkdownRenderer = ({ content }) => {
    const renderInline = useMemo(() => createInlineRenderer(), []);

    const elements = useMemo(() => {
        if (!content) return [];

        const normalized = content.replace(/\r\n?/g, '\n');
        const lines = normalized.split('\n');
        const nodes = [];
        let key = 0;

        const parseTableRow = (row) => {
            const cells = row.split('|').map((cell) => cell.trim());
            if (cells.length && cells[0] === '') cells.shift();
            if (cells.length && cells[cells.length - 1] === '') cells.pop();
            return cells;
        };

        let currentParagraph = [];
        let currentList = null; // { type: 'ul' | 'ol', items: string[] }
        let currentBlockquote = [];
        let currentCode = null; // { language: string, lines: string[] }
        let currentTable = null; // { headers: string[], rows: string[][] }

        const flushParagraph = () => {
            if (currentParagraph.length) {
                const text = currentParagraph.join(' ');
                nodes.push(
                    <p key={`paragraph-${key++}`} className="my-1 leading-relaxed">
                        {renderInline(text, `paragraph-${key}`)}
                    </p>
                );
                currentParagraph = [];
            }
        };

        const flushList = () => {
            if (!currentList) return;
            const ListTag = currentList.type === 'ol' ? 'ol' : 'ul';
            const className = currentList.type === 'ol'
                ? 'my-1 ml-4 list-decimal'
                : 'my-1 ml-4 list-disc';
            nodes.push(
                <ListTag key={`list-${key++}`} className={className}>
                    {currentList.items.map((item, idx) => (
                        <li key={`list-${key}-item-${idx}`} className="my-0.5">
                            {renderInline(item.trim(), `list-${key}-item-${idx}`)}
                        </li>
                    ))}
                </ListTag>
            );
            currentList = null;
        };

        const flushBlockquote = () => {
            if (!currentBlockquote.length) return;
            const text = currentBlockquote.join(' ');
            nodes.push(
                <blockquote
                    key={`blockquote-${key++}`}
                    className="border-l-2 border-slate-300 pl-3 my-2 text-slate-600"
                >
                    {renderInline(text, `blockquote-${key}`)}
                </blockquote>
            );
            currentBlockquote = [];
        };

        const flushCode = () => {
            if (!currentCode) return;
            const codeContent = currentCode.lines.join('\n');
            const languageClass = currentCode.language ? `language-${currentCode.language}` : '';
            nodes.push(
                <div key={`code-${key++}`} className="relative group/code">
                    <pre className="bg-slate-900 text-slate-100 rounded-lg p-3 overflow-x-auto my-2">
                        <code className={languageClass}>{codeContent}</code>
                    </pre>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover/code:opacity-100 bg-slate-800 hover:bg-slate-700"
                        onClick={() => {
                            navigator.clipboard.writeText(codeContent);
                            toast.success('Code copied');
                        }}
                    >
                        <Copy className="h-3 w-3 text-slate-400" />
                    </Button>
                </div>
            );
            currentCode = null;
        };

        const flushTable = () => {
            if (!currentTable) return;
            nodes.push(
                <div key={`table-${key++}`} className="overflow-x-auto my-2">
                    <table className="min-w-full divide-y divide-slate-200 text-xs">
                        <thead className="bg-slate-50">
                            <tr>
                                {currentTable.headers.map((header, idx) => (
                                    <th key={`table-${key}-th-${idx}`} className="px-3 py-2 text-left font-medium text-slate-700">
                                        {renderInline(header.trim(), `table-${key}-th-${idx}`)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {currentTable.rows.map((row, rIdx) => (
                                <tr key={`table-${key}-row-${rIdx}`}>
                                    {row.map((cell, cIdx) => (
                                        <td key={`table-${key}-td-${rIdx}-${cIdx}`} className="px-3 py-2 text-slate-600">
                                            {renderInline(cell.trim(), `table-${key}-td-${rIdx}-${cIdx}`)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
            currentTable = null;
        };

        const flushAll = () => {
            flushParagraph();
            flushList();
            flushBlockquote();
            flushCode();
            flushTable();
        };

        let i = 0;
        while (i < lines.length) {
            const line = lines[i];
            const trimmed = line.trim();

            if (currentCode) {
                if (trimmed.startsWith('```')) {
                    flushCode();
                } else {
                    currentCode.lines.push(line.replace(/\t/g, '    '));
                }
                i += 1;
                continue;
            }

            if (trimmed.startsWith('```')) {
                flushParagraph();
                flushList();
                flushBlockquote();
                flushTable();
                const language = trimmed.slice(3).trim();
                currentCode = { language, lines: [] };
                i += 1;
                continue;
            }

            if (currentTable) {
                if (!trimmed || !line.includes('|')) {
                    flushTable();
                } else {
                    const cells = parseTableRow(line);
                    currentTable.rows.push(cells);
                    i += 1;
                    continue;
                }
            }

            if (!trimmed) {
                flushAll();
                i += 1;
                continue;
            }

            const headingMatch = /^(#{1,6})\s+(.*)/.exec(trimmed);
            if (headingMatch) {
                flushAll();
                const level = headingMatch[1].length;
                const text = headingMatch[2];
                const HeadingTag = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3';
                const headingClass = level === 1
                    ? 'text-lg font-semibold my-2'
                    : level === 2
                        ? 'text-base font-semibold my-2'
                        : 'text-sm font-semibold my-2';
                nodes.push(
                    <HeadingTag key={`heading-${key++}`} className={headingClass}>
                        {renderInline(text, `heading-${key}`)}
                    </HeadingTag>
                );
                i += 1;
                continue;
            }

            if (trimmed.startsWith('>')) {
                flushParagraph();
                flushList();
                flushTable();
                currentBlockquote.push(trimmed.replace(/^>\s?/, ''));
                i += 1;
                continue;
            }

            const listMatch = /^([-*])\s+(.*)/.exec(trimmed) || /^(\d+)\.\s+(.*)/.exec(trimmed);
            if (listMatch) {
                flushParagraph();
                flushBlockquote();
                flushTable();
                const isOrdered = !!listMatch[1] && /\d/.test(listMatch[1][0]);
                const type = isOrdered ? 'ol' : 'ul';
                const itemText = listMatch[2] ?? listMatch[3];
                if (!currentList || currentList.type !== type) {
                    flushList();
                    currentList = { type, items: [] };
                }
                currentList.items.push(itemText ?? '');
                i += 1;
                continue;
            }

            if (line.includes('|') && i + 1 < lines.length) {
                const nextLine = lines[i + 1].trim();
                if (/^\|?(\s*:?-+:?\s*\|)+\s*$/.test(nextLine)) {
                    flushParagraph();
                    flushList();
                    flushBlockquote();
                    flushTable();
                    const headers = parseTableRow(line);
                    currentTable = { headers, rows: [] };
                    i += 2; // skip divider line
                    continue;
                }
            }

            currentParagraph.push(trimmed);
            i += 1;
        }

        flushAll();

        return nodes;
    }, [content, renderInline]);

    if (!elements.length) return null;

    return (
        <div className="text-sm prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            {elements}
        </div>
    );
};

const FunctionDisplay = ({ toolCall }) => {
    const [expanded, setExpanded] = useState(false);
    const name = toolCall?.name || 'Function';
    const status = toolCall?.status || 'pending';
    const results = toolCall?.results;
    
    // Parse and check for errors
    const parsedResults = (() => {
        if (!results) return null;
        try {
            return typeof results === 'string' ? JSON.parse(results) : results;
        } catch {
            return results;
        }
    })();
    
    const isError = results && (
        (typeof results === 'string' && /error|failed/i.test(results)) ||
        (parsedResults?.success === false)
    );
    
    // Status configuration
    const statusConfig = {
        pending: { icon: Clock, color: 'text-slate-400', text: 'Pending' },
        running: { icon: Loader2, color: 'text-slate-500', text: 'Running...', spin: true },
        in_progress: { icon: Loader2, color: 'text-slate-500', text: 'Running...', spin: true },
        completed: isError ? 
            { icon: AlertCircle, color: 'text-red-500', text: 'Failed' } : 
            { icon: CheckCircle2, color: 'text-green-600', text: 'Success' },
        success: { icon: CheckCircle2, color: 'text-green-600', text: 'Success' },
        failed: { icon: AlertCircle, color: 'text-red-500', text: 'Failed' },
        error: { icon: AlertCircle, color: 'text-red-500', text: 'Failed' }
    }[status] || { icon: Zap, color: 'text-slate-500', text: '' };
    
    const Icon = statusConfig.icon;
    const formattedName = name.split('.').reverse().join(' ').toLowerCase();
    
    return (
        <div className="mt-2 text-xs">
            <button
                onClick={() => setExpanded(!expanded)}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all",
                    "hover:bg-slate-50",
                    expanded ? "bg-slate-50 border-slate-300" : "bg-white border-slate-200"
                )}
            >
                <Icon className={cn("h-3 w-3", statusConfig.color, statusConfig.spin && "animate-spin")} />
                <span className="text-slate-700">{formattedName}</span>
                {statusConfig.text && (
                    <span className={cn("text-slate-500", isError && "text-red-600")}>
                        • {statusConfig.text}
                    </span>
                )}
                {!statusConfig.spin && (toolCall.arguments_string || results) && (
                    <ChevronRight className={cn("h-3 w-3 text-slate-400 transition-transform ml-auto", 
                        expanded && "rotate-90")} />
                )}
            </button>
            
            {expanded && !statusConfig.spin && (
                <div className="mt-1.5 ml-3 pl-3 border-l-2 border-slate-200 space-y-2">
                    {toolCall.arguments_string && (
                        <div>
                            <div className="text-xs text-slate-500 mb-1">Parameters:</div>
                            <pre className="bg-slate-50 rounded-md p-2 text-xs text-slate-600 whitespace-pre-wrap">
                                {(() => {
                                    try {
                                        return JSON.stringify(JSON.parse(toolCall.arguments_string), null, 2);
                                    } catch {
                                        return toolCall.arguments_string;
                                    }
                                })()}
                            </pre>
                        </div>
                    )}
                    {parsedResults && (
                        <div>
                            <div className="text-xs text-slate-500 mb-1">Result:</div>
                            <pre className="bg-slate-50 rounded-md p-2 text-xs text-slate-600 whitespace-pre-wrap max-h-48 overflow-auto">
                                {typeof parsedResults === 'object' ? 
                                    JSON.stringify(parsedResults, null, 2) : parsedResults}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default function MessageBubble({ message }) {
    const isUser = message.role === 'user';
    
    return (
        <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
            {!isUser && (
                <div className="h-7 w-7 rounded-lg bg-indigo-100 flex items-center justify-center mt-0.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                </div>
            )}
            <div className={cn("max-w-[85%]", isUser && "flex flex-col items-end")}>
                {message.content && (
                    <div className={cn(
                        "rounded-2xl px-4 py-2.5",
                        isUser ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 shadow-sm"
                    )}>
                        {isUser ? (
                            <p className="text-sm leading-relaxed">{message.content}</p>
                        ) : (
                            <MarkdownRenderer content={message.content} />
                        )}
                    </div>
                )}
                
                {message.tool_calls?.length > 0 && (
                    <div className="space-y-1 mt-2">
                        {message.tool_calls.map((toolCall, idx) => (
                            <FunctionDisplay key={idx} toolCall={toolCall} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}