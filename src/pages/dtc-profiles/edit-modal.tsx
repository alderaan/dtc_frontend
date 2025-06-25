import { useUpdate, useNotification } from "@refinedev/core";
import { Modal, Form, Input, Select, Button, Space } from "antd";
import { IDtcProfileWithDetails, DtcProfileStatus } from "../../interfaces/dtc-profile";
import { useState, useEffect } from "react";

interface EditModalProps {
    open: boolean;
    onClose: () => void;
    profile: IDtcProfileWithDetails | null;
    onSuccess?: () => void;
}

export const EditModal: React.FC<EditModalProps> = ({ open, onClose, profile, onSuccess }) => {
    const { mutate } = useUpdate();
    const { open: openNotification } = useNotification();
    const [form] = Form.useForm();
    const [status, setStatus] = useState<DtcProfileStatus>("active");
    const [notes, setNotes] = useState<string>("");

    useEffect(() => {
        if (profile) {
            setStatus(profile.status);
            setNotes(profile.notes || "");
            form.setFieldsValue({
                status: profile.status,
                notes: profile.notes || "",
            });
        }
    }, [profile, form]);

    const handleSubmit = () => {
        if (profile?.id) {
            mutate(
                {
                    resource: "dtc_profiles",
                    id: profile.id,
                    values: {
                        status,
                        notes,
                    },
                },
                {
                    onSuccess: () => {
                        onClose();
                        onSuccess?.();
                    }
                }
            );
        }
    };

    return (
        <Modal
            title="Edit Profile"
            open={open}
            onCancel={onClose}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Cancel
                </Button>,
                <Button key="submit" type="primary" onClick={handleSubmit}>
                    Save
                </Button>,
            ]}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
            >
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
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}; 