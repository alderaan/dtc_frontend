import { CrudOperators, CrudFilter, LogicalFilter, useTable, useUpdate } from "@refinedev/core";
import { Table, Button, Tag, Input, DatePicker, Space, Select } from "antd";
import type { Dayjs } from 'dayjs';
import type { ColumnType, ColumnGroupType } from 'antd/es/table';
import type { FilterDropdownProps } from 'antd/es/table/interface';
import { EditOutlined, FilterOutlined } from "@ant-design/icons";
import { IDtcProfileWithDetails } from "../../interfaces/dtc-profile";
import { useState } from "react";
import { EditModal } from "./edit-modal";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;

type LogicalOperator = Exclude<CrudOperators, "or" | "and">;

export const DtcProfilesList: React.FC = () => {
    const [selectedProfile, setSelectedProfile] = useState<IDtcProfileWithDetails | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const { mutateAsync } = useUpdate();

    const {
        tableQueryResult: { data, isLoading, refetch },
        current,
        setCurrent,
        pageSize,
        setPageSize,
        pageCount,
        sorters,
        setSorters,
        filters,
        setFilters,
    } = useTable<IDtcProfileWithDetails>({
        resource: "dtc_profiles_with_latest_details",
        pagination: {
            pageSize: 10,
            mode: "server",
        },
    });

    const handleEditSuccess = () => {
        // Refetch the data to show the updated values
        refetch();
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return dateString;
        }
        return date.toLocaleString();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "success";
            case "flagged_for_removal":
                return "error";
            case "pending_review":
                return "processing";
            case "removed":
                return "default";
            default:
                return "default";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "active":
                return "Active";
            case "flagged_for_removal":
                return "Flagged for Removal";
            case "pending_review":
                return "Pending Review";
            case "removed":
                return "Removed";
            default:
                return status;
        }
    };

    // Helper function to check if a filter is a LogicalFilter
    const isLogicalFilter = (filter: CrudFilter): filter is LogicalFilter => {
        return "field" in filter;
    };

    // Helper function to format filter values for display
    const formatFilterValue = (field: string, value: any, operator: string) => {
        if (!value) return '';
        
        switch (operator) {
            case 'contains':
                return `Contains: ${value}`;
            case 'between':
                if (Array.isArray(value)) {
                    const [start, end] = value;
                    return `${dayjs(start).format('YYYY-MM-DD')} to ${dayjs(end).format('YYYY-MM-DD')}`;
                }
                return '';
            case 'in':
                if (Array.isArray(value)) {
                    return value.map(v => getStatusLabel(v)).join(', ');
                }
                return '';
            case 'eq':
                return `= ${value}`;
            case 'gt':
                return `> ${value}`;
            case 'lt':
                return `< ${value}`;
            default:
                return value.toString();
        }
    };

    const statusOptions = [
        { value: "active", label: "Active" },
        { value: "pending_review", label: "Pending Review" },
        { value: "flagged_for_removal", label: "Flagged for Removal" },
        { value: "removed", label: "Removed" },
    ];

    // Helper for text filter (server-side)
    const getTextFilterDropdown = (dataIndex: string) => ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: FilterDropdownProps) => {
        const [operator, setOperator] = useState<LogicalOperator>('contains');
        
        const handleFilter = () => {
            setFilters([{ field: dataIndex, operator, value: selectedKeys[0] }], 'merge');
            confirm();
        };

        return (
            <div style={{ padding: 8 }}>
                <Input
                    placeholder={`Search ${dataIndex}`}
                    value={selectedKeys[0]}
                    onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={handleFilter}
                    style={{ width: 188, marginBottom: 8, display: 'block' }}
                />
                <Space>
                    <Button
                        type="primary"
                        onClick={handleFilter}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Search
                    </Button>
                    <Button onClick={() => { 
                        const currentFilters = filters?.filter((f: CrudFilter) => !isLogicalFilter(f) || f.field !== dataIndex) || [];
                        setFilters(currentFilters, 'replace');
                        if (clearFilters) {
                            clearFilters();
                        }
                        confirm();
                    }} size="small" style={{ width: 90 }}>
                        Reset
                    </Button>
                </Space>
            </div>
        );
    };

    // Helper for date range filter (server-side)
    const getDateFilterDropdown = (dataIndex: string) => ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
        <div style={{ padding: 8 }}>
            <RangePicker
                style={{ marginBottom: 8, display: 'block' }}
                value={selectedKeys[0] as unknown as [Dayjs, Dayjs]}
                onChange={dates => {
                    setSelectedKeys(dates ? [dates as unknown as React.Key] : []);
                }}
            />
            <Space>
                <Button
                    type="primary"
                    onClick={() => {
                        const range = selectedKeys[0] as unknown as [Dayjs, Dayjs];
                        const value = [range[0].toISOString(), range[1].toISOString()];
                        const currentFilters = filters?.filter((f: CrudFilter) => !isLogicalFilter(f) || f.field !== dataIndex) || [];
                        setFilters([...currentFilters, { field: dataIndex, operator: 'between', value }], 'replace');
                        confirm();
                    }}
                    size="small"
                    style={{ width: 90 }}
                >
                    Filter
                </Button>
                <Button onClick={() => {
                    const currentFilters = filters?.filter((f: CrudFilter) => !isLogicalFilter(f) || f.field !== dataIndex) || [];
                    setFilters(currentFilters, 'replace');
                    if (clearFilters) {
                        clearFilters();
                    }
                    confirm();
                }} size="small" style={{ width: 90 }}>
                    Reset
                </Button>
            </Space>
        </div>
    );

    // Helper for integer filter (server-side)
    const getIntegerFilterDropdown = (dataIndex: string) => ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: FilterDropdownProps) => {
        const filter = (selectedKeys[0] as unknown as { type: LogicalOperator, value: string, value2: string }) || { type: 'eq', value: '', value2: '' };
        return (
            <div style={{ padding: 8 }}>
                <Select
                    value={filter.type}
                    style={{ width: '100%', marginBottom: 8 }}
                    onChange={type => setSelectedKeys([{ ...filter, type }] as unknown as React.Key[])}
                    options={[
                        { value: 'eq', label: 'Equals' },
                        { value: 'gt', label: 'Greater than' },
                        { value: 'lt', label: 'Less than' },
                        { value: 'between', label: 'Between' },
                    ]}
                />
                <Input
                    placeholder="Value"
                    value={filter.value}
                    style={{ marginBottom: 8, display: 'block' }}
                    onChange={e => {
                        const value = e.target.value;
                        setSelectedKeys([{ ...filter, value }] as unknown as React.Key[]);
                    }}
                />
                {filter.type === 'between' && (
                    <Input
                        placeholder="Second Value"
                        value={filter.value2}
                        style={{ marginBottom: 8, display: 'block' }}
                        onChange={e => {
                            const value = e.target.value;
                            setSelectedKeys([{ ...filter, value2: value }] as unknown as React.Key[]);
                        }}
                    />
                )}
                <Space>
                    <Button
                        type="primary"
                        onClick={() => {
                            const { type, value, value2 } = selectedKeys[0] as unknown as { type: LogicalOperator, value: string, value2: string };
                            let filterValue: any = parseInt(value, 10);
                            if (isNaN(filterValue)) {
                                filterValue = value;
                            }

                            let operator = type;
                            if (type === 'between') {
                                let secondValue = parseInt(value2, 10);
                                if (isNaN(secondValue)) {
                                    secondValue = 0;
                                }
                                filterValue = [filterValue, secondValue];
                            }

                            const currentFilters = filters?.filter((f: CrudFilter) => !isLogicalFilter(f) || f.field !== dataIndex) || [];
                            setFilters([...currentFilters, { field: dataIndex, operator, value: filterValue }], 'replace');
                            confirm();
                        }}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Filter
                    </Button>
                    <Button onClick={() => { 
                        const currentFilters = filters?.filter((f: CrudFilter) => !isLogicalFilter(f) || f.field !== dataIndex) || [];
                        setFilters(currentFilters, 'replace');
                        if (clearFilters) {
                            clearFilters();
                        }
                        confirm();
                    }} size="small" style={{ width: 90 }}>
                        Reset
                    </Button>
                </Space>
            </div>
        );
    };

    // Status filter (server-side)
    const getStatusFilterDropdown = ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
        <div style={{ padding: 8 }}>
            <Space direction="vertical">
                {statusOptions.map(option => (
                    <Tag.CheckableTag
                        key={option.value}
                        checked={(selectedKeys as React.Key[]).includes(option.value)}
                        onChange={checked => {
                            let nextKeys = checked
                                ? [...selectedKeys, option.value]
                                : (selectedKeys as React.Key[]).filter(k => k !== option.value);
                            setSelectedKeys(nextKeys);
                        }}
                        style={{ cursor: 'pointer', fontSize: 14 }}
                    >
                        {option.label}
                    </Tag.CheckableTag>
                ))}
                <Space>
                    <Button
                        type="primary"
                        onClick={() => {
                            setFilters([{ field: 'status', operator: 'in', value: selectedKeys }], 'merge');
                            confirm();
                        }}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Filter
                    </Button>
                    <Button onClick={() => { 
                        const currentFilters = filters?.filter((f: CrudFilter) => !isLogicalFilter(f) || f.field !== 'status') || [];
                        setFilters(currentFilters, 'replace');
                        if (clearFilters) {
                            clearFilters();
                        }
                        confirm();
                    }} size="small" style={{ width: 90 }}>
                        Reset
                    </Button>
                </Space>
            </Space>
        </div>
    );

    const columns: (ColumnGroupType<IDtcProfileWithDetails> | ColumnType<IDtcProfileWithDetails>)[] = [
        {
            title: "Actions",
            key: "actions",
            width: 100,
            render: (_, record: IDtcProfileWithDetails) => (
                <Button
                    icon={<EditOutlined />}
                    onClick={() => {
                        setSelectedProfile(record);
                        setIsEditModalOpen(true);
                    }}
                />
            ),
        },
        {
            title: () => {
                const filter = filters?.find((f: CrudFilter): f is LogicalFilter => isLogicalFilter(f) && f.field === "id");
                return (
                    <div>
                        <div>ID</div>
                        {filter && (
                            <div style={{ fontSize: '12px', color: '#1890ff' }}>
                                {formatFilterValue("id", filter.value, filter.operator)}
                            </div>
                        )}
                    </div>
                );
            },
            dataIndex: "id",
            key: "id",
            width: 90,
            filterDropdown: getIntegerFilterDropdown("id"),
            filterIcon: (filtered: boolean) => (
                <FilterOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
            ),
            filterDropdownProps: {
                onOpenChange: (visible: boolean) => {
                    if (visible) {
                        setTimeout(() => {
                            const input = document.querySelector('input[type="number"]') as HTMLInputElement;
                            if (input) {
                                input.focus();
                            }
                        }, 100);
                    }
                }
            },
            sorter: true,
        },
        {
            title: () => {
                const filter = filters?.find((f: CrudFilter): f is LogicalFilter => isLogicalFilter(f) && f.field === "profile_url");
                return (
                    <div>
                        <div>Profile URL</div>
                        {filter && (
                            <div style={{ fontSize: '12px', color: '#1890ff' }}>
                                {formatFilterValue("profile_url", filter.value, filter.operator)}
                            </div>
                        )}
                    </div>
                );
            },
            dataIndex: "profile_url",
            key: "profile_url",
            width: 250,
            render: (url: string) => <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>,
            filterDropdown: getTextFilterDropdown("profile_url"),
            filteredValue: filters?.find((f: CrudFilter): f is LogicalFilter => isLogicalFilter(f) && f.field === "profile_url")?.value ? [filters.find((f: CrudFilter) => isLogicalFilter(f) && f.field === "profile_url")?.value] : null,
            filterIcon: (filtered: boolean) => <FilterOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
            sorter: true,
        },
        {
            title: () => {
                const filter = filters?.find((f: CrudFilter): f is LogicalFilter => isLogicalFilter(f) && f.field === "external_url");
                return (
                    <div>
                        <div>External URL</div>
                        {filter && (
                            <div style={{ fontSize: '12px', color: '#1890ff' }}>
                                {formatFilterValue("external_url", filter.value, filter.operator)}
                            </div>
                        )}
                    </div>
                );
            },
            dataIndex: "external_url",
            key: "external_url",
            width: 250,
            render: (url: string) => url ? <a href={url} target="_blank" rel="noopener noreferrer">{url}</a> : null,
            filterDropdown: getTextFilterDropdown("external_url"),
            filteredValue: filters?.find((f: CrudFilter): f is LogicalFilter => isLogicalFilter(f) && f.field === "external_url")?.value ? [filters.find((f: CrudFilter) => isLogicalFilter(f) && f.field === "external_url")?.value] : null,
            filterIcon: (filtered: boolean) => <FilterOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
            sorter: true,
        },
        {
            title: () => {
                const filter = filters?.find((f: CrudFilter): f is LogicalFilter => isLogicalFilter(f) && f.field === "status");
                return (
                    <div>
                        <div>Status</div>
                        {filter && (
                            <div style={{ fontSize: '12px', color: '#1890ff' }}>
                                {formatFilterValue("status", filter.value, filter.operator)}
                            </div>
                        )}
                    </div>
                );
            },
            dataIndex: "status",
            key: "status",
            width: 200,
            render: (status: string) => (
                <Tag color={getStatusColor(status)}>
                    {getStatusLabel(status)}
                </Tag>
            ),
            filterDropdown: getStatusFilterDropdown,
            filteredValue: filters?.find((f: CrudFilter): f is LogicalFilter => isLogicalFilter(f) && f.field === "status")?.value ? [filters.find((f: CrudFilter) => isLogicalFilter(f) && f.field === "status")?.value] : null,
            filterIcon: (filtered: boolean) => <FilterOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
            sorter: true,
        },
        {
            title: () => {
                const filter = filters?.find((f: CrudFilter): f is LogicalFilter => isLogicalFilter(f) && f.field === "notes");
                return (
                    <div>
                        <div>Notes</div>
                        {filter && (
                            <div style={{ fontSize: '12px', color: '#1890ff' }}>
                                {formatFilterValue("notes", filter.value, filter.operator)}
                            </div>
                        )}
                    </div>
                );
            },
            dataIndex: "notes",
            key: "notes",
            width: 300,
            filterDropdown: getTextFilterDropdown("notes"),
            filteredValue: filters?.find((f: CrudFilter): f is LogicalFilter => isLogicalFilter(f) && f.field === "notes")?.value ? [filters.find((f: CrudFilter) => isLogicalFilter(f) && f.field === "notes")?.value] : null,
            filterIcon: (filtered: boolean) => <FilterOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
            sorter: true,
        },
        {
            title: () => {
                const filter = filters?.find((f: CrudFilter): f is LogicalFilter => isLogicalFilter(f) && f.field === "full_name");
                return (
                    <div>
                        <div>Full Name</div>
                        {filter && (
                            <div style={{ fontSize: '12px', color: '#1890ff' }}>
                                {formatFilterValue("full_name", filter.value, filter.operator)}
                            </div>
                        )}
                    </div>
                );
            },
            dataIndex: "full_name",
            key: "full_name",
            width: 180,
            filterDropdown: getTextFilterDropdown("full_name"),
            filteredValue: filters?.find((f: CrudFilter): f is LogicalFilter => isLogicalFilter(f) && f.field === "full_name")?.value ? [filters.find((f: CrudFilter) => isLogicalFilter(f) && f.field === "full_name")?.value] : null,
            filterIcon: (filtered: boolean) => <FilterOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
            sorter: true,
        },
        {
            title: () => {
                const filter = filters?.find((f: CrudFilter): f is LogicalFilter => isLogicalFilter(f) && f.field === "biography");
                return (
                    <div>
                        <div>Biography</div>
                        {filter && (
                            <div style={{ fontSize: '12px', color: '#1890ff' }}>
                                {formatFilterValue("biography", filter.value, filter.operator)}
                            </div>
                        )}
                    </div>
                );
            },
            dataIndex: "biography",
            key: "biography",
            width: 400,
            filterDropdown: getTextFilterDropdown("biography"),
            filteredValue: filters?.find((f: CrudFilter): f is LogicalFilter => isLogicalFilter(f) && f.field === "biography")?.value ? [filters.find((f: CrudFilter) => isLogicalFilter(f) && f.field === "biography")?.value] : null,
            filterIcon: (filtered: boolean) => <FilterOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
            sorter: true,
        },
        {
            title: () => {
                const filter = filters?.find((f: CrudFilter): f is LogicalFilter => isLogicalFilter(f) && f.field === "followers_count");
                return (
                    <div>
                        <div>Followers</div>
                        {filter && (
                            <div style={{ fontSize: '12px', color: '#1890ff' }}>
                                {formatFilterValue("followers_count", filter.value, filter.operator)}
                            </div>
                        )}
                    </div>
                );
            },
            dataIndex: "followers_count",
            key: "followers_count",
            width: 120,
            render: (count: number) => count ? Math.floor(count) : '',
            filterDropdown: getIntegerFilterDropdown("followers_count"),
            filteredValue: filters?.find((f: CrudFilter): f is LogicalFilter => isLogicalFilter(f) && f.field === "followers_count")?.value ? [filters.find((f: CrudFilter) => isLogicalFilter(f) && f.field === "followers_count")?.value] : null,
            filterIcon: (filtered: boolean) => <FilterOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
            sorter: true,
            filterDropdownProps: {
                onOpenChange: (visible: boolean) => {
                    if (visible) {
                        setTimeout(() => {
                            const input = document.querySelector('input[type="number"]') as HTMLInputElement;
                            if (input) {
                                input.focus();
                            }
                        }, 100);
                    }
                }
            }
        },
        {
            title: () => {
                const filter = filters?.find((f: CrudFilter): f is LogicalFilter => isLogicalFilter(f) && f.field === "posts_count");
                return (
                    <div>
                        <div>Posts</div>
                        {filter && (
                            <div style={{ fontSize: '12px', color: '#1890ff' }}>
                                {formatFilterValue("posts_count", filter.value, filter.operator)}
                            </div>
                        )}
                    </div>
                );
            },
            dataIndex: "posts_count",
            key: "posts_count",
            width: 100,
            filterDropdown: getIntegerFilterDropdown("posts_count"),
            filteredValue: filters?.find((f: CrudFilter): f is LogicalFilter => isLogicalFilter(f) && f.field === "posts_count")?.value ? [filters.find((f: CrudFilter) => isLogicalFilter(f) && f.field === "posts_count")?.value] : null,
            filterIcon: (filtered: boolean) => <FilterOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
            sorter: true,
            filterDropdownProps: {
                onOpenChange: (visible: boolean) => {
                    if (visible) {
                        setTimeout(() => {
                            const input = document.querySelector('input[type="number"]') as HTMLInputElement;
                            if (input) {
                                input.focus();
                            }
                        }, 100);
                    }
                }
            }
        },
        {
            title: () => {
                const filter = filters?.find((f: CrudFilter): f is LogicalFilter => isLogicalFilter(f) && f.field === "search_term");
                return (
                    <div>
                        <div>Search Term</div>
                        {filter && (
                            <div style={{ fontSize: '12px', color: '#1890ff' }}>
                                {formatFilterValue("search_term", filter.value, filter.operator)}
                            </div>
                        )}
                    </div>
                );
            },
            dataIndex: "search_term",
            key: "search_term",
            width: 200,
            filterDropdown: getTextFilterDropdown("search_term"),
            filteredValue: filters?.find((f: CrudFilter): f is LogicalFilter => isLogicalFilter(f) && f.field === "search_term")?.value ? [filters.find((f: CrudFilter) => isLogicalFilter(f) && f.field === "search_term")?.value] : null,
            filterIcon: (filtered: boolean) => <FilterOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
            sorter: true,
        },
        {
            title: () => {
                const filter = filters?.find((f: CrudFilter): f is LogicalFilter => isLogicalFilter(f) && f.field === "search_term_en");
                return (
                    <div>
                        <div>Search Term (EN)</div>
                        {filter && (
                            <div style={{ fontSize: '12px', color: '#1890ff' }}>
                                {formatFilterValue("search_term_en", filter.value, filter.operator)}
                            </div>
                        )}
                    </div>
                );
            },
            dataIndex: "search_term_en",
            key: "search_term_en",
            width: 200,
            filterDropdown: getTextFilterDropdown("search_term_en"),
            filteredValue: filters?.find((f: CrudFilter): f is LogicalFilter => isLogicalFilter(f) && f.field === "search_term_en")?.value ? [filters.find((f: CrudFilter) => isLogicalFilter(f) && f.field === "search_term_en")?.value] : null,
            filterIcon: (filtered: boolean) => <FilterOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
            sorter: true,
        },
        {
            title: () => {
                const filter = filters?.find((f: CrudFilter): f is LogicalFilter => isLogicalFilter(f) && f.field === "category");
                return (
                    <div>
                        <div>Category</div>
                        {filter && (
                            <div style={{ fontSize: '12px', color: '#1890ff' }}>
                                {formatFilterValue("category", filter.value, filter.operator)}
                            </div>
                        )}
                    </div>
                );
            },
            dataIndex: "category",
            key: "category",
            width: 200,
            filterDropdown: getTextFilterDropdown("category"),
            filteredValue: filters?.find((f: CrudFilter): f is LogicalFilter => isLogicalFilter(f) && f.field === "category")?.value ? [filters.find((f: CrudFilter) => isLogicalFilter(f) && f.field === "category")?.value] : null,
            filterIcon: (filtered: boolean) => <FilterOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
            sorter: true,
        },
        {
            title: () => {
                const filter = filters?.find((f: CrudFilter): f is LogicalFilter => isLogicalFilter(f) && f.field === "updated_at");
                return (
                    <div>
                        <div>Updated At</div>
                        {filter && (
                            <div style={{ fontSize: '12px', color: '#1890ff' }}>
                                {formatFilterValue("updated_at", filter.value, filter.operator)}
                            </div>
                        )}
                    </div>
                );
            },
            dataIndex: "updated_at",
            key: "updated_at",
            width: 200,
            render: (date: string) => formatDate(date),
            filterDropdown: getDateFilterDropdown("updated_at"),
            filteredValue: filters?.find((f: CrudFilter): f is LogicalFilter => isLogicalFilter(f) && f.field === "updated_at")?.value ? [filters.find((f: CrudFilter) => isLogicalFilter(f) && f.field === "updated_at")?.value] : null,
            filterIcon: (filtered: boolean) => <FilterOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
            sorter: true,
        },
        {
            title: () => {
                const filter = filters?.find((f: CrudFilter): f is LogicalFilter => isLogicalFilter(f) && f.field === "last_scraped_at");
                return (
                    <div>
                        <div>Last Scraped At</div>
                        {filter && (
                            <div style={{ fontSize: '12px', color: '#1890ff' }}>
                                {formatFilterValue("last_scraped_at", filter.value, filter.operator)}
                            </div>
                        )}
                    </div>
                );
            },
            dataIndex: "last_scraped_at",
            key: "last_scraped_at",
            width: 200,
            render: (date: string) => formatDate(date),
            filterDropdown: getDateFilterDropdown("last_scraped_at"),
            filteredValue: filters?.find((f: CrudFilter): f is LogicalFilter => isLogicalFilter(f) && f.field === "last_scraped_at")?.value ? [filters.find((f: CrudFilter) => isLogicalFilter(f) && f.field === "last_scraped_at")?.value] : null,
            filterIcon: (filtered: boolean) => <FilterOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
            sorter: true,
        },
    ];

    return (
        <div style={{ width: "100%" }}>
            <Table
                dataSource={data?.data}
                columns={columns}
                loading={isLoading}
                rowKey="id"
                pagination={{
                    total: data?.total,
                    current: current,
                    pageSize: pageSize,
                    onChange: (page, pageSize) => {
                        setCurrent(page);
                        setPageSize(pageSize);
                    },
                    showSizeChanger: true,
                    pageSizeOptions: [10, 25, 50, 100],
                }}
                scroll={{ x: 1500 }}
                onChange={(pagination, filters, sorter: any) => {
                    if (Array.isArray(sorter)) {
                        setSorters(
                            sorter.map(({ field, order }) => ({
                                field: field as string,
                                order: order === "ascend" ? "asc" : "desc",
                            }))
                        );
                    } else if (sorter.field) {
                        setSorters([{
                            field: sorter.field as string,
                            order: sorter.order === "ascend" ? "asc" : "desc",
                        }]);
                    }
                }}
            />
            <EditModal
                open={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedProfile(null);
                }}
                profile={selectedProfile}
                onSuccess={handleEditSuccess}
            />
        </div>
    );
}; 