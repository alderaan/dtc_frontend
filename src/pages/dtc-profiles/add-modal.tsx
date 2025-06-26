import { useCreate, useNotification } from "@refinedev/core";
import { Modal, Form, Input, Select, Button } from "antd";
import { DtcProfileStatus } from "../../interfaces/dtc-profile";
import { useState } from "react";

interface AddModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const AddModal: React.FC<AddModalProps> = ({ open, onClose, onSuccess }) => {
    const { mutate, isLoading } = useCreate();
    const { open: openNotification } = useNotification();
    const [form] = Form.useForm();
    const [status, setStatus] = useState<DtcProfileStatus>("active");
    const [notes, setNotes] = useState<string>("");

    const handleSubmit = () => {
        form.validateFields().then((values) => {
            mutate(
                {
                    resource: "dtc_profiles",
                    values: {
                        username: values.username,
                        status: values.status,
                        notes: values.notes || "",
                    },
                },
                {
                    onSuccess: () => {
                        openNotification({
                            type: "success",
                            message: "Profile created successfully",
                        });
                        form.resetFields();
                        setStatus("active");
                        setNotes("");
                        onClose();
                        onSuccess?.();
                    },
                    onError: (error) => {
                        openNotification({
                            type: "error",
                            message: "Failed to create profile",
                            description: error.message,
                        });
                    }
                }
            );
        });
    };

    const handleCancel = () => {
        form.resetFields();
        setStatus("active");
        setNotes("");
        onClose();
    };

    return (
        <Modal
            title="Add New DTC Profile"
            open={open}
            onCancel={handleCancel}
            footer={[
                <Button key="cancel" onClick={handleCancel}>
                    Cancel
                </Button>,
                <Button 
                    key="submit" 
                    type="primary" 
                    onClick={handleSubmit}
                    loading={isLoading}
                >
                    Create
                </Button>,
            ]}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                    status: "active",
                    notes: "",
                }}
            >
                <Form.Item
                    name="username"
                    label="Username"
                    rules={[
                        { required: true, message: "Please enter a username" },
                        { 
                            pattern: /^[a-zA-Z0-9._]+$/, 
                            message: "Username can only contain letters, numbers, dots, and underscores" 
                        }
                    ]}
                >
                    <Input 
                        placeholder="Enter Instagram username"
                        addonBefore="@"
                    />
                </Form.Item>
                <Form.Item
                    name="status"
                    label="Status"
                    rules={[{ required: true, message: "Please select a status" }]}
                >
                    <Select
                        value={status}
                        onChange={(value) => setStatus(value)}
                    >
                        <Select.Option value="active">Active</Select.Option>
                        <Select.Option value="pending_review">Pending Review</Select.Option>
                        <Select.Option value="flagged_for_removal">Flagged for Removal</Select.Option>
                        <Select.Option value="removed">Removed</Select.Option>
                    </Select>
                </Form.Item>
                <Form.Item
                    name="notes"
                    label="Notes"
                >
                    <Input.TextArea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        placeholder="Add any notes about this profile..."
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}; 